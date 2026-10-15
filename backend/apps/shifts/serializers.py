from rest_framework import serializers
from .models import Shift, EmployeeShiftAssignment
from apps.employees.models import EmployeeProfile

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = [
            'id', 'name', 'start_time', 'end_time', 'grace_minutes',
            'minimum_work_minutes', 'weekly_off_days', 'is_overnight',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class EmployeeShiftAssignmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)

    class Meta:
        model = EmployeeShiftAssignment
        fields = [
            'id', 'employee', 'employee_name', 'shift', 'shift_name',
            'effective_from', 'effective_to', 'is_active'
        ]
        read_only_fields = ['id']
