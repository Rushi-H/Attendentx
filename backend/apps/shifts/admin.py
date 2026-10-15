from django.contrib import admin
from .models import Shift, EmployeeShiftAssignment

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'grace_minutes', 'minimum_work_minutes', 'is_overnight', 'is_active')
    list_filter = ('is_active', 'is_overnight')

@admin.register(EmployeeShiftAssignment)
class EmployeeShiftAssignmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'shift', 'effective_from', 'effective_to', 'is_active')
    list_filter = ('is_active', 'shift')
