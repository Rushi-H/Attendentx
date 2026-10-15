from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user_obj = User.objects.filter(email=email).first()
            if user_obj and not user_obj.is_active and user_obj.check_password(password):
                raise serializers.ValidationError('This user account has been deactivated.')

            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
        else:
            raise serializers.ValidationError('Must include email and password.')

        attrs['user'] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    employee_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'is_active', 'date_joined', 'last_login', 'employee_profile']
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_employee_profile(self, obj):
        profile = getattr(obj, 'employee_profile', None)
        if not profile:
            return None
        return {
            'id': str(profile.id),
            'employee_code': profile.employee_code,
            'full_name': profile.full_name,
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'phone': profile.phone,
            'designation': profile.designation,
            'department': {
                'id': str(profile.department.id),
                'name': profile.department.name
            } if profile.department else None,
            'office': {
                'id': str(profile.office.id),
                'name': profile.office.name,
                'timezone': profile.office.timezone
            } if profile.office else None,
            'employment_status': profile.employment_status,
            'joining_date': str(profile.joining_date) if profile.joining_date else None,
        }

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password does not match.')
        return value

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

