import uuid
from django.db import models
from django.utils import timezone
from apps.offices.models import Office
from apps.employees.models import EmployeeProfile

class AttendanceSessionStatus(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    CLOSED = 'CLOSED', 'Closed'

class AttendanceSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='attendance_sessions'
    )
    attendance_date = models.DateField(db_index=True)
    opens_at = models.DateTimeField()
    closes_at = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=AttendanceSessionStatus.choices,
        default=AttendanceSessionStatus.OPEN
    )

    class Meta:
        db_table = 'attendance_sessions'
        unique_together = ('office', 'attendance_date')
        ordering = ['-attendance_date']

    def __str__(self):
        return f"{self.office.name} Session: {self.attendance_date}"

class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', 'Present'
    LATE = 'LATE', 'Late'
    ABSENT = 'ABSENT', 'Absent'
    HALF_DAY = 'HALF_DAY', 'Half Day'
    ON_LEAVE = 'ON_LEAVE', 'On Leave'
    HOLIDAY = 'HOLIDAY', 'Holiday'
    WEEKLY_OFF = 'WEEKLY_OFF', 'Weekly Off'
    PENDING_REVIEW = 'PENDING_REVIEW', 'Pending Review'
    MANUALLY_ADJUSTED = 'MANUALLY_ADJUSTED', 'Manually Adjusted'

class AttendanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    attendance_session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='records'
    )
    attendance_date = models.DateField(db_index=True)
    check_in_at = models.DateTimeField(db_index=True)
    check_out_at = models.DateTimeField(null=True, blank=True)
    attendance_status = models.CharField(
        max_length=30,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT,
        db_index=True
    )
    working_minutes = models.PositiveIntegerField(default=0)
    verification_method = models.CharField(max_length=50, default='STRICT_IP_ALLOWLIST')
    verification_result = models.CharField(max_length=50, default='ALLOWED')
    check_in_ip = models.GenericIPAddressField(null=True, blank=True)
    check_out_ip = models.GenericIPAddressField(null=True, blank=True)
    is_manual_correction = models.BooleanField(default=False)
    correction_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendance_records'
        unique_together = ('employee', 'attendance_date')
        ordering = ['-attendance_date', '-check_in_at']
        indexes = [
            models.Index(fields=['attendance_date', 'attendance_status']),
            models.Index(fields=['employee', 'attendance_date']),
        ]

    def __str__(self):
        return f"{self.employee.full_name} - {self.attendance_date} [{self.attendance_status}]"

class AttendanceAttempt(models.Model):
    class Action(models.TextChoices):
        CHECK_IN = 'CHECK_IN', 'Check In'
        CHECK_OUT = 'CHECK_OUT', 'Check Out'
        ELIGIBILITY = 'ELIGIBILITY', 'Eligibility Check'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_attempts'
    )
    office = models.ForeignKey(
        Office,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_attempts'
    )
    attempted_at = models.DateTimeField(default=timezone.now, db_index=True)
    action = models.CharField(max_length=30, choices=Action.choices)
    observed_ip = models.CharField(max_length=64)
    verification_result = models.CharField(max_length=30)
    reason_code = models.CharField(max_length=60)
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'attendance_attempts'
        ordering = ['-attempted_at']

    def __str__(self):
        return f"Attempt by {self.employee} ({self.action}): {self.verification_result} [{self.reason_code}]"
