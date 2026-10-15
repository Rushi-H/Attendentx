import uuid
from django.db import models
from apps.employees.models import EmployeeProfile

class Shift(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120, unique=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    grace_minutes = models.PositiveIntegerField(default=15)
    minimum_work_minutes = models.PositiveIntegerField(default=480)
    # 0 = Monday, 1 = Tuesday, ..., 5 = Saturday, 6 = Sunday
    weekly_off_days = models.JSONField(default=list)
    is_overnight = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shifts'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"

class EmployeeShiftAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name='shift_assignments'
    )
    shift = models.ForeignKey(
        Shift,
        on_delete=models.PROTECT,
        related_name='employee_assignments'
    )
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'employee_shift_assignments'
        ordering = ['-effective_from']

    def __str__(self):
        return f"{self.employee.full_name} -> {self.shift.name} (from {self.effective_from})"
