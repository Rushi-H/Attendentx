from django.contrib import admin
from .models import Office, NetworkPolicy, Holiday

@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('name', 'timezone', 'is_active', 'created_at')
    search_fields = ('name',)

@admin.register(NetworkPolicy)
class NetworkPolicyAdmin(admin.ModelAdmin):
    list_display = ('office', 'verification_mode', 'allowed_ip_ranges', 'strict_mode_enabled', 'is_active')
    list_filter = ('verification_mode', 'strict_mode_enabled', 'is_active')

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'office', 'is_recurring')
    list_filter = ('date', 'is_recurring')
