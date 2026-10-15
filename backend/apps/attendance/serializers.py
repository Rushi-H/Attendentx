from rest_framework import serializers
from .models import AttendanceRecord, AttendanceAttempt, AttendanceStatus

class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True, default='')

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'department_name',
            'attendance_date', 'check_in_at', 'check_out_at', 'attendance_status',
            'working_minutes', 'verification_method', 'verification_result',
            'check_in_ip', 'check_out_ip', 'is_manual_correction', 'correction_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class AttendanceCorrectionSerializer(serializers.Serializer):
    check_in_at = serializers.DateTimeField(required=False)
    check_out_at = serializers.DateTimeField(required=False, allow_null=True)
    attendance_status = serializers.ChoiceField(choices=AttendanceStatus.choices, required=False)
    correction_reason = serializers.CharField(required=True, min_length=5)

    def validate(self, attrs):
        check_in = attrs.get('check_in_at')
        check_out = attrs.get('check_out_at')
        if check_in and check_out and check_out < check_in:
            raise serializers.ValidationError('check_out_at cannot be earlier than check_in_at.')
        return attrs

class AttendanceAttemptSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)

    class Meta:
        model = AttendanceAttempt
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'office_name',
            'attempted_at', 'action', 'observed_ip', 'verification_result',
            'reason_code', 'notes'
        ]
        read_only_fields = ['id', 'attempted_at']
