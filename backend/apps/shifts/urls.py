from django.urls import path
from .views import ShiftListCreateView, ShiftDetailView, AssignShiftView

urlpatterns = [
    path('', ShiftListCreateView.as_view(), name='shift-list-create'),
    path('assign/', AssignShiftView.as_view(), name='shift-assign'),
    path('<uuid:pk>/', ShiftDetailView.as_view(), name='shift-detail'),
]
