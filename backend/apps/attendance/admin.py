from django.contrib import admin
from .models import AttendanceRecord, AttendanceAttempt, AttendanceSession

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('employee', 'attendance_date', 'check_in_at', 'check_out_at', 'attendance_status', 'working_minutes', 'is_manual_correction')
    list_filter = ('attendance_status', 'attendance_date', 'is_manual_correction')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_code')

@admin.register(AttendanceAttempt)
class AttendanceAttemptAdmin(admin.ModelAdmin):
    list_display = ('attempted_at', 'employee', 'action', 'observed_ip', 'verification_result', 'reason_code')
    list_filter = ('action', 'verification_result')
    search_fields = ('employee__employee_code', 'observed_ip')

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ('office', 'attendance_date', 'status', 'opens_at', 'closes_at')
