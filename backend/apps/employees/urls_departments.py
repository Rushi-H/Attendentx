from django.urls import path
from .views import DepartmentListCreateView, DepartmentDetailView

urlpatterns = [
    path('', DepartmentListCreateView.as_view(), name='department-list-create'),
    path('<uuid:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
]
