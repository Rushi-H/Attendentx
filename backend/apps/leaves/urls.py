from django.urls import path
from .views import LeaveListCreateView, LeaveReviewView

urlpatterns = [
    path('', LeaveListCreateView.as_view(), name='leave-list-create'),
    path('<uuid:pk>/review/', LeaveReviewView.as_view(), name='leave-review'),
]
