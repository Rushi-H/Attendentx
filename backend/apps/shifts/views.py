from rest_framework import generics, permissions, status
from common.permissions import IsHROrAdmin
from common.utils import standard_response
from apps.audit.services.logger import AuditService
from apps.offices.services.network import NetworkVerificationService
from .models import Shift, EmployeeShiftAssignment
from .serializers import ShiftSerializer, EmployeeShiftAssignmentSerializer

class ShiftListCreateView(generics.ListCreateAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
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
            action='CREATE_SHIFT',
            entity_type='Shift',
            entity_id=str(instance.id),
            new_values=serializer.data,
            reason="Admin created shift",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        return standard_response(serializer.data, status_code=status.HTTP_201_CREATED)

class ShiftDetailView(generics.RetrieveUpdateAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [IsHROrAdmin]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standard_response(serializer.data)

class AssignShiftView(generics.CreateAPIView):
    serializer_class = EmployeeShiftAssignmentSerializer
    permission_classes = [IsHROrAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee = serializer.validated_data['employee']
        # Deactivate previous active assignments for this employee
        EmployeeShiftAssignment.objects.filter(employee=employee, is_active=True).update(is_active=False)

        assignment = serializer.save(is_active=True)
        AuditService.log_action(
            actor=request.user,
            action='ASSIGN_SHIFT',
            entity_type='EmployeeShiftAssignment',
            entity_id=str(assignment.id),
            new_values={'employee': str(employee.id), 'shift': str(assignment.shift.id)},
            reason="Admin assigned shift to employee",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        return standard_response(serializer.data, message="Shift assigned successfully", status_code=status.HTTP_201_CREATED)
