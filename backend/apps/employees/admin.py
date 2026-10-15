from django.contrib import admin
from .models import Department, EmployeeProfile

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name',)

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('employee_code', 'full_name', 'department', 'designation', 'office', 'employment_status')
    list_filter = ('employment_status', 'department', 'office')
    search_fields = ('employee_code', 'first_name', 'last_name', 'user__email')
