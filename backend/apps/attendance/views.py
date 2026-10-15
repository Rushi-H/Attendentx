from django.shortcuts import get_object_or_404
from rest_framework import views, generics, permissions, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from common.permissions import IsHROrAdmin, IsSuperAdmin
from common.utils import standard_response
from apps.audit.services.logger import AuditService
from apps.offices.services.network import NetworkVerificationService
from .models import AttendanceRecord, AttendanceAttempt
from .serializers import AttendanceRecordSerializer, AttendanceCorrectionSerializer, AttendanceAttemptSerializer
from .services.engine import AttendanceEngine

class AttendanceEligibilityView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        employee = getattr(request.user, 'employee_profile', None)
        if not employee:
            return standard_response(None, message="No linked employee profile found.", success=False, status_code=status.HTTP_404_NOT_FOUND)

        data = AttendanceEngine.get_eligibility(request, employee)
        return standard_response(data)

class CheckInView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        employee = getattr(request.user, 'employee_profile', None)
        if not employee:
            return standard_response(None, message="No linked employee profile found.", success=False, status_code=status.HTTP_404_NOT_FOUND)

        notes = request.data.get('notes', '')
        record = AttendanceEngine.check_in(request, employee, notes=notes)
        serializer = AttendanceRecordSerializer(record)
        return standard_response(serializer.data, message="Check-in marked successfully", status_code=status.HTTP_201_CREATED)

class CheckOutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        employee = getattr(request.user, 'employee_profile', None)
        if not employee:
            return standard_response(None, message="No linked employee profile found.", success=False, status_code=status.HTTP_404_NOT_FOUND)

        notes = request.data.get('notes', '')
        record = AttendanceEngine.check_out(request, employee, notes=notes)
        serializer = AttendanceRecordSerializer(record)
        return standard_response(serializer.data, message="Check-out marked successfully")

class TodayAttendanceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        employee = getattr(request.user, 'employee_profile', None)
        if not employee:
            return standard_response(None, message="No linked employee profile found.", success=False, status_code=status.HTTP_404_NOT_FOUND)

        _, today = AttendanceEngine.get_office_now(employee.office)
        record = AttendanceRecord.objects.filter(employee=employee, attendance_date=today).first()
        if not record:
            return standard_response(None, message="No attendance marked today.")

        serializer = AttendanceRecordSerializer(record)
        return standard_response(serializer.data)

class AttendanceHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        employee = getattr(self.request.user, 'employee_profile', None)
        if not employee:
            return AttendanceRecord.objects.none()

        qs = AttendanceRecord.objects.filter(employee=employee).select_related('employee', 'employee__department')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month and year:
            qs = qs.filter(attendance_date__month=month, attendance_date__year=year)
        elif year:
            qs = qs.filter(attendance_date__year=year)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(serializer.data)

class AdminAttendanceListView(generics.ListAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = AttendanceRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['attendance_date', 'attendance_status', 'employee__department', 'employee']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_code']
    ordering_fields = ['attendance_date', 'check_in_at', 'working_minutes']

    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related('employee', 'employee__department', 'employee__office').all()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            qs = qs.filter(attendance_date__range=[start_date, end_date])
        elif start_date:
            qs = qs.filter(attendance_date__gte=start_date)
        elif end_date:
            qs = qs.filter(attendance_date__lte=end_date)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(serializer.data)

class AdminAttendanceCorrectionView(views.APIView):
    permission_classes = [IsHROrAdmin]

    def patch(self, request, pk):
        record = get_object_or_404(AttendanceRecord, pk=pk)
        old_data = AttendanceRecordSerializer(record).data

        serializer = AttendanceCorrectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        if 'check_in_at' in validated:
            record.check_in_at = validated['check_in_at']
        if 'check_out_at' in validated:
            record.check_out_at = validated['check_out_at']
            if record.check_in_at and record.check_out_at:
                duration_seconds = (record.check_out_at - record.check_in_at).total_seconds()
                record.working_minutes = max(0, int(duration_seconds // 60))
        if 'attendance_status' in validated:
            record.attendance_status = validated['attendance_status']

        record.is_manual_correction = True
        record.correction_reason = validated['correction_reason']
        record.save()

        new_data = AttendanceRecordSerializer(record).data

        AuditService.log_action(
            actor=request.user,
            action='CORRECT_ATTENDANCE',
            entity_type='AttendanceRecord',
            entity_id=str(record.id),
            old_values=old_data,
            new_values=new_data,
            reason=validated['correction_reason'],
            ip_address=NetworkVerificationService.get_client_ip(request)
        )

        return standard_response(new_data, message="Attendance record corrected successfully")

class AttendanceAttemptListView(generics.ListAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = AttendanceAttemptSerializer
    queryset = AttendanceAttempt.objects.select_related('employee', 'office').all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(serializer.data)
