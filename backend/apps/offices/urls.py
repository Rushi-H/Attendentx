from django.urls import path
from .views import OfficeListCreateView, OfficeDetailView, HolidayListCreateView

urlpatterns = [
    path('', OfficeListCreateView.as_view(), name='office-list-create'),
    path('<uuid:pk>/', OfficeDetailView.as_view(), name='office-detail'),
    path('holidays/', HolidayListCreateView.as_view(), name='holiday-list-create'),
]
