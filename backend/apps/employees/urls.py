from django.urls import path
from .views import EmployeeListCreateView, EmployeeDetailView, EmployeeMeView

urlpatterns = [
    path('', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('me/', EmployeeMeView.as_view(), name='employee-me'),
    path('<uuid:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
]
