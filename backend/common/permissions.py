"""
Role-Based Access Control (RBAC) Permissions.
"""
from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Grants access strictly to SUPER_ADMIN users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser)
        )

class IsHROrAdmin(permissions.BasePermission):
    """
    Grants access to SUPER_ADMIN and HR_ADMIN users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ('SUPER_ADMIN', 'HR_ADMIN')
        )

class IsEmployeeSelfOrAdmin(permissions.BasePermission):
    """
    Allows employees to access/modify only their own records,
    while allowing HR/Super Admins full access.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role in ('SUPER_ADMIN', 'HR_ADMIN'):
            return True

        # Check if the target object relates to current employee profile or user
        target_user = getattr(obj, 'user', None)
        target_employee = getattr(obj, 'employee', None)

        if target_user and target_user == request.user:
            return True

        if target_employee and hasattr(request.user, 'employee_profile'):
            return target_employee == request.user.employee_profile

        if hasattr(obj, 'user_id') and obj.user_id == request.user.id:
            return True

        return False
