from rest_framework import generics, permissions, status
from rest_framework.response import Response
from common.permissions import IsSuperAdmin, IsHROrAdmin
from common.utils import standard_response
from apps.audit.services.logger import AuditService
from .models import Office, NetworkPolicy, Holiday
from .serializers import OfficeSerializer, NetworkPolicySerializer, HolidaySerializer
from .services.network import NetworkVerificationService

class OfficeListCreateView(generics.ListCreateAPIView):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    permission_classes = [IsHROrAdmin]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        office = serializer.save()
        # Automatically create default network policy for newly created office
        NetworkPolicy.objects.create(
            office=office,
            allowed_ip_ranges=['223.236.99.39/32']
        )
        AuditService.log_action(
            actor=request.user,
            action='CREATE_OFFICE',
            entity_type='Office',
            entity_id=str(office.id),
            new_values=serializer.data,
            reason="Office created by admin",
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        return standard_response(serializer.data, status_code=status.HTTP_201_CREATED)

class OfficeDetailView(generics.RetrieveUpdateAPIView):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    permission_classes = [IsHROrAdmin]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standard_response(serializer.data)

class NetworkPolicySettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = NetworkPolicySerializer
    permission_classes = [IsSuperAdmin]

    def get_object(self):
        # Retrieve headquarters or primary office policy, or first available
        policy = NetworkPolicy.objects.select_related('office').first()
        if not policy:
            office = Office.objects.first()
            if not office:
                office = Office.objects.create(name="Headquarters", timezone="Asia/Kolkata")
            policy = NetworkPolicy.objects.create(
                office=office,
                allowed_ip_ranges=['223.236.99.39/32']
            )
        return policy

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        current_ip = NetworkVerificationService.get_client_ip(request)
        data = serializer.data
        data['client_observed_ip'] = current_ip
        return standard_response(data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        old_values = self.get_serializer(instance).data
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        AuditService.log_action(
            actor=request.user,
            action='UPDATE_NETWORK_POLICY',
            entity_type='NetworkPolicy',
            entity_id=str(instance.id),
            old_values=old_values,
            new_values=serializer.data,
            reason=request.data.get('reason', 'Updated network security policy'),
            ip_address=NetworkVerificationService.get_client_ip(request)
        )
        return standard_response(serializer.data, message="Network policy updated successfully")

class HolidayListCreateView(generics.ListCreateAPIView):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHROrAdmin()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(serializer.data)
