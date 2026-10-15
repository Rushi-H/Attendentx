from django.urls import path
from .views import NetworkPolicySettingsView

urlpatterns = [
    path('network/', NetworkPolicySettingsView.as_view(), name='settings-network'),
]
