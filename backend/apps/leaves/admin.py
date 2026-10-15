from django.contrib import admin
from .models import LeaveRequest

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'status', 'reviewed_by', 'created_at')
    list_filter = ('status', 'leave_type')
    search_fields = ('employee__first_name', 'employee__last_name', 'reason')
