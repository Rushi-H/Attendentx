from django.urls import path
from .views import (
    AttendanceSummaryReportView,
    MonthlyMatrixReportView,
    LateArrivalsReportView,
    ExportReportView
)

urlpatterns = [
    path('attendance/', AttendanceSummaryReportView.as_view(), name='report-attendance-summary'),
    path('monthly/', MonthlyMatrixReportView.as_view(), name='report-monthly-matrix'),
    path('late-arrivals/', LateArrivalsReportView.as_view(), name='report-late-arrivals'),
    path('export/', ExportReportView.as_view(), name='report-export'),
]
