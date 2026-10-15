"""
URL Configuration for Office Attendance Management System.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/offices/', include('apps.offices.urls')),
    path('api/v1/employees/', include('apps.employees.urls')),
    path('api/v1/departments/', include('apps.employees.urls_departments')),
    path('api/v1/shifts/', include('apps.shifts.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/leaves/', include('apps.leaves.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/settings/', include('apps.offices.urls_settings')),
]
