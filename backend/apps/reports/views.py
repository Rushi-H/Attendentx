from django.db.models import Count, Q, Avg
from django.utils import timezone
from rest_framework import views, permissions, status
from common.permissions import IsHROrAdmin
from common.utils import standard_response
from apps.attendance.models import AttendanceRecord, AttendanceStatus
from apps.employees.models import EmployeeProfile, EmploymentStatus
from apps.leaves.models import LeaveRequest, LeaveStatus
from apps.offices.models import Office
from .services.export import ExportService

class AttendanceSummaryReportView(views.APIView):
    permission_classes = [IsHROrAdmin]

    def get(self, request):
        today = timezone.now().date()
        date_str = request.query_params.get('date', str(today))

        total_active_employees = EmployeeProfile.objects.filter(employment_status=EmploymentStatus.ACTIVE).count()
        today_records = AttendanceRecord.objects.filter(attendance_date=date_str)

        present_count = today_records.filter(attendance_status=AttendanceStatus.PRESENT).count()
        late_count = today_records.filter(attendance_status=AttendanceStatus.LATE).count()
        half_day_count = today_records.filter(attendance_status=AttendanceStatus.HALF_DAY).count()
        pending_review_count = today_records.filter(attendance_status=AttendanceStatus.PENDING_REVIEW).count()

        on_leave_count = LeaveRequest.objects.filter(
            status=LeaveStatus.APPROVED,
            start_date__lte=date_str,
            end_date__gte=date_str
        ).count()

        marked_total = present_count + late_count + half_day_count + pending_review_count
        absent_count = max(0, total_active_employees - marked_total - on_leave_count)

        attendance_rate = round((marked_total / total_active_employees * 100), 1) if total_active_employees > 0 else 0.0

        data = {
            'date': date_str,
            'kpis': {
                'total_employees': total_active_employees,
                'present_today': present_count,
                'late_today': late_count,
                'half_day_today': half_day_count,
                'absent_today': absent_count,
                'on_leave_today': on_leave_count,
                'pending_reviews': pending_review_count,
                'attendance_rate': attendance_rate,
            },
            'recent_check_ins': [
                {
                    'id': str(r.id),
                    'employee_name': r.employee.full_name,
                    'employee_code': r.employee.employee_code,
                    'department': r.employee.department.name if r.employee.department else 'N/A',
                    'check_in_at': r.check_in_at.isoformat() if r.check_in_at else None,
                    'status': r.attendance_status,
                    'ip_verified': r.verification_result == 'ALLOWED',
                }
                for r in today_records.order_by('-check_in_at')[:10]
            ]
        }
        return standard_response(data)

class MonthlyMatrixReportView(views.APIView):
    permission_classes = [IsHROrAdmin]

    def get(self, request):
        now = timezone.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        employees = EmployeeProfile.objects.filter(employment_status=EmploymentStatus.ACTIVE).select_related('department')
        records = AttendanceRecord.objects.filter(
            attendance_date__year=year,
            attendance_date__month=month
        ).values('employee_id', 'attendance_status').annotate(count=Count('id'))

        # Map employee aggregations
        agg_map = {}
        for r in records:
            emp_id = str(r['employee_id'])
            if emp_id not in agg_map:
                agg_map[emp_id] = {'present': 0, 'late': 0, 'half_day': 0, 'leave': 0, 'total_working_minutes': 0}
            status_val = r['attendance_status']
            if status_val == AttendanceStatus.PRESENT:
                agg_map[emp_id]['present'] += r['count']
            elif status_val == AttendanceStatus.LATE:
                agg_map[emp_id]['late'] += r['count']
            elif status_val == AttendanceStatus.HALF_DAY:
                agg_map[emp_id]['half_day'] += r['count']

        result = []
        for emp in employees:
            emp_id = str(emp.id)
            stats = agg_map.get(emp_id, {'present': 0, 'late': 0, 'half_day': 0, 'leave': 0})
            result.append({
                'employee_id': emp_id,
                'employee_code': emp.employee_code,
                'full_name': emp.full_name,
                'department': emp.department.name if emp.department else 'N/A',
                'present_days': stats['present'],
                'late_days': stats['late'],
                'half_days': stats['half_day'],
            })

        return standard_response({'month': month, 'year': year, 'employees': result})

class LateArrivalsReportView(views.APIView):
    permission_classes = [IsHROrAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timezone.timedelta(days=days)

        late_records = AttendanceRecord.objects.filter(
            attendance_status=AttendanceStatus.LATE,
            attendance_date__gte=start_date
        ).select_related('employee', 'employee__department').order_by('-attendance_date')

        data = [
            {
                'id': str(r.id),
                'employee_name': r.employee.full_name,
                'employee_code': r.employee.employee_code,
                'department': r.employee.department.name if r.employee.department else 'N/A',
                'date': str(r.attendance_date),
                'check_in_at': r.check_in_at.isoformat() if r.check_in_at else None,
                'is_manual_correction': r.is_manual_correction
            }
            for r in late_records[:50]
        ]
        return standard_response(data)

class ExportReportView(views.APIView):
    permission_classes = [IsHROrAdmin]

    def perform_content_negotiation(self, request, force=False):
        return (None, None)

    def get(self, request):
        fmt = request.query_params.get('format', 'csv').lower()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = AttendanceRecord.objects.select_related('employee', 'employee__department').order_by('-attendance_date', '-check_in_at')

        if start_date and end_date:
            qs = qs.filter(attendance_date__range=[start_date, end_date])
        elif start_date:
            qs = qs.filter(attendance_date__gte=start_date)
        elif end_date:
            qs = qs.filter(attendance_date__lte=end_date)

        if fmt == 'excel' or fmt == 'xlsx':
            return ExportService.export_excel(qs)
        return ExportService.export_csv(qs)
