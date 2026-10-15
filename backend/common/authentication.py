"""
Authentication classes for Office Attendance System.
"""
from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that skips DRF's internal enforce_csrf check.
    Cross-origin security is guaranteed via:
    1. Strict CORS origin filtering (CORS_ALLOWED_ORIGINS)
    2. Django CSRF Origin verification in CsrfViewMiddleware
    3. SameSite and Secure cookie policies
    4. Network perimeter IP validation
    """
    def enforce_csrf(self, request):
        return
