from rest_framework import serializers
from django.db import transaction
from apps.accounts.models import User, UserRole
from apps.offices.models import Office
from .models import Department, EmployeeProfile, EmploymentStatus

class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(source='employees.count', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'employee_count']
        read_only_fields = ['id', 'created_at']

class EmployeeProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    assigned_shift = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user_id', 'employee_code', 'first_name', 'last_name', 'full_name',
            'email', 'role', 'phone', 'department', 'department_name',
            'office', 'office_name', 'designation', 'joining_date',
            'employment_status', 'assigned_shift', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'full_name', 'created_at', 'updated_at']

    def get_assigned_shift(self, obj):
        # Look for active shift assignment
        assignment = obj.shift_assignments.filter(is_active=True).select_related('shift').first()
        if assignment and assignment.shift:
            shift = assignment.shift
            return {
                'id': str(shift.id),
                'name': shift.name,
                'start_time': shift.start_time.strftime('%H:%M:%S'),
                'end_time': shift.end_time.strftime('%H:%M:%S'),
                'grace_minutes': shift.grace_minutes,
                'minimum_work_minutes': shift.minimum_work_minutes,
                'is_overnight': shift.is_overnight,
            }
        return None

class EmployeeCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.EMPLOYEE)
    employee_code = serializers.CharField(max_length=50)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    office = serializers.PrimaryKeyRelatedField(queryset=Office.objects.all(), required=False, allow_null=True)
    designation = serializers.CharField(max_length=120, required=False, allow_blank=True)
    joining_date = serializers.DateField(required=False, allow_null=True)
    shift_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_employee_code(self, value):
        if EmployeeProfile.objects.filter(employee_code=value).exists():
            raise serializers.ValidationError('This employee code is already taken.')
        return value

    def create(self, validated_data):
        from apps.shifts.models import Shift, EmployeeShiftAssignment
        from django.utils import timezone

        email = validated_data.pop('email')
        password = validated_data.pop('password')
        role = validated_data.pop('role', UserRole.EMPLOYEE)
        shift_id = validated_data.pop('shift_id', None)

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                role=role
            )
            # Default office if not provided
            if not validated_data.get('office'):
                validated_data['office'] = Office.objects.first()

            profile = EmployeeProfile.objects.create(
                user=user,
                **validated_data
            )

            if shift_id:
                try:
                    shift = Shift.objects.get(id=shift_id)
                    EmployeeShiftAssignment.objects.create(
                        employee=profile,
                        shift=shift,
                        effective_from=profile.joining_date or timezone.now().date(),
                        is_active=True
                    )
                except Shift.DoesNotExist:
                    pass

        return profile
