import pytest
from rest_framework.test import APIClient
from django.utils import timezone
import datetime
from apps.accounts.models import User, UserRole
from apps.offices.models import Office, NetworkPolicy, VerificationMode
from apps.employees.models import Department, EmployeeProfile, EmploymentStatus
from apps.shifts.models import Shift, EmployeeShiftAssignment

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def office(db):
    off = Office.objects.create(name="HQ Office", timezone="Asia/Kolkata")
    NetworkPolicy.objects.create(
        office=off,
        verification_mode=VerificationMode.STRICT_IP_ALLOWLIST,
        allowed_ip_ranges=['223.236.99.39/32', '127.0.0.1/32'],
        strict_mode_enabled=True,
        is_active=True
    )
    return off

@pytest.fixture
def department(db):
    return Department.objects.create(name="Tech", description="Technology Department")

@pytest.fixture
def shift(db):
    return Shift.objects.create(
        name="General Shift",
        start_time=datetime.time(9, 30),
        end_time=datetime.time(18, 30),
        grace_minutes=15,
        minimum_work_minutes=480,
        weekly_off_days=[5, 6],
        is_active=True
    )

@pytest.fixture
def superuser(db, office, department):
    user = User.objects.create_superuser(
        email='super@company.com',
        password='TestPassword123!',
        role=UserRole.SUPER_ADMIN
    )
    EmployeeProfile.objects.create(
        user=user,
        employee_code='SUP-001',
        first_name='Super',
        last_name='User',
        department=department,
        office=office,
        employment_status=EmploymentStatus.ACTIVE
    )
    return user

@pytest.fixture
def employee_user(db, office, department, shift):
    user = User.objects.create_user(
        email='alex@company.com',
        password='TestPassword123!',
        role=UserRole.EMPLOYEE
    )
    profile = EmployeeProfile.objects.create(
        user=user,
        employee_code='EMP-2001',
        first_name='Alex',
        last_name='Smith',
        department=department,
        office=office,
        employment_status=EmploymentStatus.ACTIVE,
        joining_date=timezone.now().date()
    )
    EmployeeShiftAssignment.objects.create(
        employee=profile,
        shift=shift,
        effective_from=timezone.now().date(),
        is_active=True
    )
    return user

@pytest.fixture
def hr_user(db, office, department):
    user = User.objects.create_user(
        email='hr_tester@company.com',
        password='TestPassword123!',
        role=UserRole.HR_ADMIN
    )
    EmployeeProfile.objects.create(
        user=user,
        employee_code='HR-101',
        first_name='HR',
        last_name='Manager',
        department=department,
        office=office,
        employment_status=EmploymentStatus.ACTIVE
    )
    return user
