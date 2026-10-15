from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source='actor.email', read_only=True, default='System')

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_email', 'action', 'entity_type',
            'entity_id', 'old_values', 'new_values', 'reason',
            'ip_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
