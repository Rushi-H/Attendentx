from rest_framework import generics, permissions, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from common.permissions import IsHROrAdmin, IsEmployeeSelfOrAdmin
from common.utils import standard_response
from apps.audit.services.logger import AuditService
from apps.offices.services.network import NetworkVerificationService
from .models import Department, EmployeeProfile
from .serializers import DepartmentSerializer, EmployeeProfileSerializer, EmployeeCreateSerializer

class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHROrAdmin()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        AuditService.log_action(
            actor=request.user,
            action='CREATE_DEPARTMENT',
            entity_type='Department',
            entity_id=str(instance.id),
            new_values=serializer.data,
            reason="Admin created department",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        return standard_response(serializer.data, status_code=status.HTTP_201_CREATED)

class DepartmentDetailView(generics.RetrieveUpdateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsHROrAdmin]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standard_response(serializer.data)

class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = EmployeeProfile.objects.select_related('user', 'department', 'office').prefetch_related('shift_assignments__shift').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'office', 'employment_status']
    search_fields = ['first_name', 'last_name', 'employee_code', 'user__email', 'designation']
    ordering_fields = ['first_name', 'employee_code', 'joining_date', 'created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EmployeeCreateSerializer
        return EmployeeProfileSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = EmployeeProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = EmployeeProfileSerializer(queryset, many=True)
        return standard_response(serializer.data)

    def create(self, request, *args, **kwargs):
        if not (request.user.role in ('SUPER_ADMIN', 'HR_ADMIN') or request.user.is_superuser):
            return standard_response(None, message="Forbidden: Admin role required to register employees.", success=False, status_code=status.HTTP_403_FORBIDDEN)

        serializer = EmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        AuditService.log_action(
            actor=request.user,
            action='CREATE_EMPLOYEE',
            entity_type='EmployeeProfile',
            entity_id=str(profile.id),
            new_values={'employee_code': profile.employee_code, 'email': profile.user.email},
            reason="Admin registered new employee profile",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        output_serializer = EmployeeProfileSerializer(profile)
        return standard_response(output_serializer.data, message="Employee registered successfully", status_code=status.HTTP_201_CREATED)

class EmployeeDetailView(generics.RetrieveUpdateAPIView):
    queryset = EmployeeProfile.objects.select_related('user', 'department', 'office').prefetch_related('shift_assignments__shift').all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsEmployeeSelfOrAdmin]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standard_response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        AuditService.log_action(
            actor=request.user,
            action='UPDATE_EMPLOYEE',
            entity_type='EmployeeProfile',
            entity_id=str(instance.id),
            old_values=old_data,
            new_values=serializer.data,
            reason="Employee profile updated",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        return standard_response(serializer.data, message="Profile updated successfully")

class EmployeeMeView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EmployeeProfileSerializer

    def get_object(self):
        return getattr(self.request.user, 'employee_profile', None)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return standard_response(None, message="No linked employee profile found.", success=False, status_code=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance)
        return standard_response(serializer.data)
