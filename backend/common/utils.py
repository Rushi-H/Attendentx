"""
Common utilities for formatting responses and handling dates.
"""
from rest_framework.response import Response
from rest_framework import status

def standard_response(data=None, message="Operation successful", success=True, status_code=status.HTTP_200_OK):
    """
    Standard format envelope:
    {
        "success": True,
        "message": "...",
        "data": {...}
    }
    """
    payload = {
        "success": success,
        "message": message,
        "data": data if data is not None else {}
    }
    return Response(payload, status=status_code)
