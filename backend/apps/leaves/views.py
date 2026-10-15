from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from django_filters.rest_framework import DjangoFilterBackend
from common.permissions import IsHROrAdmin
from common.utils import standard_response
from apps.audit.services.logger import AuditService
from apps.offices.services.network import NetworkVerificationService
from .models import LeaveRequest, LeaveStatus
from .serializers import LeaveRequestSerializer, LeaveReviewSerializer

class LeaveListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LeaveRequestSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'leave_type']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('SUPER_ADMIN', 'HR_ADMIN') or user.is_superuser:
            return LeaveRequest.objects.select_related('employee', 'reviewed_by').all()
        employee = getattr(user, 'employee_profile', None)
        if not employee:
            return LeaveRequest.objects.none()
        return LeaveRequest.objects.filter(employee=employee).select_related('employee', 'reviewed_by')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(serializer.data)

    def create(self, request, *args, **kwargs):
        employee = getattr(request.user, 'employee_profile', None)
        if not employee:
            return standard_response(None, message="Only registered employees can apply for leaves.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave = serializer.save(employee=employee, status=LeaveStatus.PENDING)

        AuditService.log_action(
            actor=request.user,
            action='APPLY_LEAVE',
            entity_type='LeaveRequest',
            entity_id=str(leave.id),
            new_values=serializer.data,
            reason="Employee submitted leave application",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        return standard_response(serializer.data, message="Leave request submitted", status_code=status.HTTP_201_CREATED)

class LeaveReviewView(generics.UpdateAPIView):
    permission_classes = [IsHROrAdmin]
    serializer_class = LeaveReviewSerializer

    def patch(self, request, pk):
        leave = get_object_or_404(LeaveRequest, pk=pk)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = leave.status
        leave.status = serializer.validated_data['status']
        leave.review_notes = serializer.validated_data.get('review_notes', '')
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save()

        AuditService.log_action(
            actor=request.user,
            action=f"REVIEW_LEAVE_{leave.status}",
            entity_type='LeaveRequest',
            entity_id=str(leave.id),
            old_values={'status': old_status},
            new_values={'status': leave.status, 'notes': leave.review_notes},
            reason=f"Admin reviewed leave request: {leave.status}",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )

        output = LeaveRequestSerializer(leave).data
        return standard_response(output, message=f"Leave request marked as {leave.status}")
