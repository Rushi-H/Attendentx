import datetime
from django.db import transaction
from django.utils import timezone
import zoneinfo
from rest_framework.exceptions import ValidationError, PermissionDenied
from apps.offices.services.network import NetworkVerificationService
from apps.offices.models import Holiday
from apps.attendance.models import (
    AttendanceRecord, AttendanceAttempt, AttendanceStatus, AttendanceSession
)
from apps.leaves.models import LeaveRequest, LeaveStatus
from apps.shifts.models import EmployeeShiftAssignment

class AttendanceEngine:
    @staticmethod
    def get_office_now(office):
        """
        Returns the current datetime and date in the office's local timezone.
        """
        tz_name = office.timezone if office and office.timezone else 'Asia/Kolkata'
        try:
            tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            tz = zoneinfo.ZoneInfo('Asia/Kolkata')
        now = timezone.now().astimezone(tz)
        return now, now.date()

    @classmethod
    def get_eligibility(cls, request, employee):
        """
        Determines whether the employee can check in or check out right now.
        """
        office = employee.office
        now, today = cls.get_office_now(office)
        verification = NetworkVerificationService.verify(request, office, action='ELIGIBILITY')

        # Log attempt
        AttendanceAttempt.objects.create(
            employee=employee,
            office=office,
            action=AttendanceAttempt.Action.ELIGIBILITY,
            observed_ip=verification.observed_ip,
            verification_result='ALLOWED' if verification.is_allowed else 'REJECTED',
            reason_code=verification.reason_code,
        )

        today_record = AttendanceRecord.objects.filter(
            employee=employee,
            attendance_date=today
        ).first()

        # Check for active shift
        assignment = EmployeeShiftAssignment.objects.filter(
            employee=employee,
            is_active=True,
            effective_from__lte=today
        ).select_related('shift').first()
        shift = assignment.shift if assignment else None

        # Check for approved leave
        has_approved_leave = LeaveRequest.objects.filter(
            employee=employee,
            status=LeaveStatus.APPROVED,
            start_date__lte=today,
            end_date__gte=today
        ).exists()

        # Check for holiday
        is_holiday = Holiday.objects.filter(
            office=office,
            date=today
        ).exists()

        can_check_in = False
        can_check_out = False
        status_code_str = 'UNKNOWN'

        if today_record:
            if today_record.check_out_at is None:
                can_check_in = False
                can_check_out = True
                status_code_str = 'CHECKED_IN'
            else:
                can_check_in = False
                can_check_out = False
                status_code_str = 'CHECKED_OUT'
        elif has_approved_leave:
            status_code_str = 'ON_LEAVE'
        elif is_holiday:
            status_code_str = 'HOLIDAY'
        elif not verification.is_allowed:
            status_code_str = 'OUTSIDE_APPROVED_NETWORK'
        else:
            can_check_in = True
            status_code_str = 'READY_TO_CHECK_IN'

        return {
            'is_eligible': can_check_in or can_check_out,
            'can_check_in': can_check_in,
            'can_check_out': can_check_out,
            'current_status': status_code_str,
            'network_verification': verification.to_dict(),
            'today_record': {
                'id': str(today_record.id),
                'attendance_date': str(today_record.attendance_date),
                'check_in_at': today_record.check_in_at.isoformat(),
                'check_out_at': today_record.check_out_at.isoformat() if today_record.check_out_at else None,
                'working_minutes': today_record.working_minutes,
                'status': today_record.attendance_status,
            } if today_record else None,
            'assigned_shift': {
                'id': str(shift.id),
                'name': shift.name,
                'start_time': shift.start_time.strftime('%H:%M:%S'),
                'end_time': shift.end_time.strftime('%H:%M:%S'),
                'grace_minutes': shift.grace_minutes,
                'minimum_work_minutes': shift.minimum_work_minutes,
            } if shift else None,
            'server_time': now.isoformat(),
            'server_date': str(today),
        }

    @classmethod
    def check_in(cls, request, employee, notes=''):
        """
        Executes atomic check-in with database locking and shift late-arrival evaluation.
        """
        office = employee.office
        now, today = cls.get_office_now(office)

        # 1. Server-side network verification
        verification = NetworkVerificationService.verify(request, office, action='CHECK_IN')

        # 2. Strict mode gate
        if not verification.is_allowed:
            AttendanceAttempt.objects.create(
                employee=employee,
                office=office,
                action=AttendanceAttempt.Action.CHECK_IN,
                observed_ip=verification.observed_ip,
                verification_result='REJECTED',
                reason_code=verification.reason_code,
                notes=notes
            )
            raise PermissionDenied(
                f"Network verification failed: Observed IP {verification.observed_ip} is outside approved office policy."
            )

        with transaction.atomic():
            # Lock existing record for today if present
            existing_record = AttendanceRecord.objects.select_for_update().filter(
                employee=employee,
                attendance_date=today
            ).first()

            if existing_record:
                raise ValidationError("Attendance has already been marked for today.")

            # Resolve active shift
            assignment = EmployeeShiftAssignment.objects.filter(
                employee=employee,
                is_active=True,
                effective_from__lte=today
            ).select_related('shift').first()
            shift = assignment.shift if assignment else None

            # Calculate status
            calculated_status = AttendanceStatus.PRESENT
            if verification.requires_review:
                calculated_status = AttendanceStatus.PENDING_REVIEW
            elif shift:
                shift_start = shift.start_time
                grace = datetime.timedelta(minutes=shift.grace_minutes)
                shift_start_dt = datetime.datetime.combine(today, shift_start, tzinfo=now.tzinfo)
                late_cutoff = shift_start_dt + grace

                if now > late_cutoff:
                    calculated_status = AttendanceStatus.LATE

            record = AttendanceRecord.objects.create(
                employee=employee,
                attendance_date=today,
                check_in_at=timezone.now(),
                attendance_status=calculated_status,
                verification_method=verification.verification_method,
                verification_result='ALLOWED' if not verification.requires_review else 'PENDING',
                check_in_ip=verification.observed_ip,
            )

            AttendanceAttempt.objects.create(
                employee=employee,
                office=office,
                action=AttendanceAttempt.Action.CHECK_IN,
                observed_ip=verification.observed_ip,
                verification_result='ALLOWED',
                reason_code=verification.reason_code,
                notes=notes
            )

            return record

    @classmethod
    def check_out(cls, request, employee, notes=''):
        """
        Executes atomic check-out and computes official working hours.
        """
        office = employee.office
        now, today = cls.get_office_now(office)

        verification = NetworkVerificationService.verify(request, office, action='CHECK_OUT')

        with transaction.atomic():
            record = AttendanceRecord.objects.select_for_update().filter(
                employee=employee,
                attendance_date=today
            ).first()

            if not record:
                raise ValidationError("No active check-in record found for today. You must check in first.")

            if record.check_out_at is not None:
                raise ValidationError("You have already checked out for today.")

            checkout_time = timezone.now()
            record.check_out_at = checkout_time
            record.check_out_ip = verification.observed_ip

            # Compute working duration in minutes
            duration_seconds = (checkout_time - record.check_in_at).total_seconds()
            working_mins = max(0, int(duration_seconds // 60))
            record.working_minutes = working_mins

            # Resolve active shift to check half-day status
            assignment = EmployeeShiftAssignment.objects.filter(
                employee=employee,
                is_active=True,
                effective_from__lte=today
            ).select_related('shift').first()

            if assignment and assignment.shift:
                min_work = assignment.shift.minimum_work_minutes
                # If worked less than half the required duration and not already pending review
                if working_mins < (min_work // 2) and record.attendance_status != AttendanceStatus.PENDING_REVIEW:
                    record.attendance_status = AttendanceStatus.HALF_DAY

            record.save()

            AttendanceAttempt.objects.create(
                employee=employee,
                office=office,
                action=AttendanceAttempt.Action.CHECK_OUT,
                observed_ip=verification.observed_ip,
                verification_result='ALLOWED' if verification.is_allowed else 'REJECTED',
                reason_code=verification.reason_code,
                notes=notes
            )

            return record
