import uuid
from django.db import models
from django.conf import settings
from apps.offices.models import Office

class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return self.name

class EmploymentStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    PROBATION = 'PROBATION', 'Probation'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    RESIGNED = 'RESIGNED', 'Resigned'

class EmployeeProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )
    employee_code = models.CharField(max_length=50, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    designation = models.CharField(max_length=120, blank=True, default='')
    office = models.ForeignKey(
        Office,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    joining_date = models.DateField(null=True, blank=True)
    employment_status = models.CharField(
        max_length=30,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employee_profiles'
        ordering = ['first_name', 'last_name']

    @property
    def full_name(self):
        if self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.first_name

    def __str__(self):
        return f"{self.full_name} ({self.employee_code})"
