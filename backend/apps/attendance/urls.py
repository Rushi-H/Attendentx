from django.urls import path
from .views import (
    AttendanceEligibilityView,
    CheckInView,
    CheckOutView,
    TodayAttendanceView,
    AttendanceHistoryView,
    AdminAttendanceListView,
    AdminAttendanceCorrectionView,
    AttendanceAttemptListView
)

urlpatterns = [
    path('eligibility/', AttendanceEligibilityView.as_view(), name='attendance-eligibility'),
    path('check-in/', CheckInView.as_view(), name='attendance-check-in'),
    path('check-out/', CheckOutView.as_view(), name='attendance-check-out'),
    path('today/', TodayAttendanceView.as_view(), name='attendance-today'),
    path('history/', AttendanceHistoryView.as_view(), name='attendance-history'),
    path('admin/', AdminAttendanceListView.as_view(), name='attendance-admin-list'),
    path('admin/<uuid:pk>/', AdminAttendanceCorrectionView.as_view(), name='attendance-admin-correct'),
    path('attempts/', AttendanceAttemptListView.as_view(), name='attendance-attempts'),
]
