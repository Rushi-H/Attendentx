from rest_framework import serializers
from .models import Office, NetworkPolicy, Holiday

class NetworkPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = NetworkPolicy
        fields = [
            'id', 'office', 'verification_mode', 'allowed_ip_ranges',
            'strict_mode_enabled', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_allowed_ip_ranges(self, value):
        import ipaddress
        if not isinstance(value, list):
            raise serializers.ValidationError('allowed_ip_ranges must be a list of IP or CIDR strings.')
        for item in value:
            try:
                ipaddress.ip_network(item.strip(), strict=False)
            except ValueError:
                raise serializers.ValidationError(f"Invalid IP address or CIDR range: '{item}'")
        return value

class OfficeSerializer(serializers.ModelSerializer):
    network_policy = NetworkPolicySerializer(read_only=True)

    class Meta:
        model = Office
        fields = ['id', 'name', 'timezone', 'address', 'is_active', 'created_at', 'network_policy']
        read_only_fields = ['id', 'created_at']

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'office', 'name', 'date', 'is_recurring']
        read_only_fields = ['id']
