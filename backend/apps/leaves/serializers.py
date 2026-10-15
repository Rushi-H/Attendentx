from rest_framework import serializers
from .models import LeaveRequest, LeaveStatus, LeaveType

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    reviewer_email = serializers.CharField(source='reviewed_by.email', read_only=True, default='')

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'leave_type',
            'start_date', 'end_date', 'reason', 'status', 'reviewed_by',
            'reviewer_email', 'review_notes', 'reviewed_at', 'created_at'
        ]
        read_only_fields = ['id', 'employee', 'status', 'reviewed_by', 'reviewed_at', 'created_at']

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError('end_date cannot be earlier than start_date.')
        return attrs

class LeaveReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[LeaveStatus.APPROVED, LeaveStatus.REJECTED])
    review_notes = serializers.CharField(required=False, allow_blank=True)
