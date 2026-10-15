"""
Standardized API Exception Handlers.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Ensures all API errors follow the uniform response structure:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "...",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        code = getattr(exc, 'default_code', 'API_ERROR').upper()
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                if 'non_field_errors' in exc.detail and exc.detail['non_field_errors']:
                    message = str(exc.detail['non_field_errors'][0])
                elif 'detail' in exc.detail:
                    message = str(exc.detail['detail'])
                else:
                    first_val = next(iter(exc.detail.values()))
                    message = str(first_val[0]) if isinstance(first_val, list) and first_val else str(first_val)
                details = exc.detail
            elif isinstance(exc.detail, list):
                message = str(exc.detail[0]) if exc.detail else "Error occurred."
                details = {"errors": exc.detail}
            else:
                message = str(exc.detail)
                details = {}
        else:
            message = str(exc)
            details = {}

        response.data = {
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    else:
        # Unhandled 500 error
        return Response({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server.",
                "details": str(exc)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
