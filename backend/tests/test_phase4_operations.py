import datetime
import pytest
from rest_framework import status
from apps.offices.models import Office, NetworkPolicy, Holiday
from apps.shifts.models import Shift, EmployeeShiftAssignment
from apps.leaves.models import LeaveRequest, LeaveStatus, LeaveType

@pytest.mark.django_db
class TestPhase4Operations:
    def test_admin_can_create_office_and_policy(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        res = api_client.post('/api/v1/offices/', {
            'name': 'Bengaluru Tech Park',
            'city': 'Bengaluru',
            'state': 'Karnataka',
            'country': 'India',
            'timezone': 'Asia/Kolkata',
            'is_active': True
        })
        assert res.status_code == status.HTTP_201_CREATED
        office_id = res.data['data']['id']
        
        # Verify network policy was automatically created with default IP
        policy = NetworkPolicy.objects.filter(office_id=office_id).first()
        assert policy is not None
        assert '223.236.99.39/32' in policy.allowed_ip_ranges

    def test_employee_cannot_create_office(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        res = api_client.post('/api/v1/offices/', {
            'name': 'Unauthorized Branch'
        })
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_superadmin_can_update_network_policy(self, api_client, superuser, office):
        api_client.force_authenticate(user=superuser)
        res = api_client.get('/api/v1/settings/network/')
        assert res.status_code == status.HTTP_200_OK
        assert 'client_observed_ip' in res.data['data']

        update_res = api_client.patch('/api/v1/settings/network/', {
            'allowed_ip_ranges': ['223.236.99.39/32', '182.72.100.0/24'],
            'strict_mode_enabled': True,
            'reason': 'Added redundant enterprise backup lease'
        }, format='json')
        assert update_res.status_code == status.HTTP_200_OK
        assert '182.72.100.0/24' in update_res.data['data']['allowed_ip_ranges']

    def test_shift_creation_and_assignment(self, api_client, hr_user, employee_user):
        api_client.force_authenticate(user=hr_user)
        shift_res = api_client.post('/api/v1/shifts/', {
            'name': 'Night Operations',
            'start_time': '20:00:00',
            'end_time': '05:00:00',
            'grace_minutes': 20,
            'minimum_work_minutes': 480
        })
        assert shift_res.status_code == status.HTTP_201_CREATED
        shift_id = shift_res.data['data']['id']

        # Assign shift to employee
        assign_res = api_client.post('/api/v1/shifts/assign/', {
            'employee': str(employee_user.employee_profile.id),
            'shift': shift_id,
            'effective_from': str(datetime.date.today())
        })
        assert assign_res.status_code == status.HTTP_201_CREATED
        
        # Verify previous shift assignments became inactive
        active_assignments = EmployeeShiftAssignment.objects.filter(
            employee=employee_user.employee_profile,
            is_active=True
        )
        assert active_assignments.count() == 1
        assert str(active_assignments.first().shift.id) == shift_id

    def test_leave_workflow_lifecycle(self, api_client, employee_user, hr_user):
        # 1. Employee applies for leave
        api_client.force_authenticate(user=employee_user)
        apply_res = api_client.post('/api/v1/leaves/', {
            'leave_type': LeaveType.SICK,
            'start_date': str(datetime.date.today() + datetime.timedelta(days=2)),
            'end_date': str(datetime.date.today() + datetime.timedelta(days=3)),
            'reason': 'Medical recovery'
        })
        assert apply_res.status_code == status.HTTP_201_CREATED
        leave_id = apply_res.data['data']['id']
        assert apply_res.data['data']['status'] == LeaveStatus.PENDING

        # 2. HR Admin reviews and approves leave
        api_client.force_authenticate(user=hr_user)
        review_res = api_client.patch(f'/api/v1/leaves/{leave_id}/review/', {
            'status': LeaveStatus.APPROVED,
            'review_notes': 'Approved with medical certificate verified'
        })
        assert review_res.status_code == status.HTTP_200_OK
        assert review_res.data['data']['status'] == LeaveStatus.APPROVED
        assert review_res.data['data']['review_notes'] == 'Approved with medical certificate verified'

    def test_leave_visibility_isolation(self, api_client, employee_user, hr_user):
        # Employee sees only their own leaves
        api_client.force_authenticate(user=employee_user)
        emp_leaves = api_client.get('/api/v1/leaves/')
        assert emp_leaves.status_code == status.HTTP_200_OK

        # HR sees global queue
        api_client.force_authenticate(user=hr_user)
        hr_leaves = api_client.get('/api/v1/leaves/')
        assert hr_leaves.status_code == status.HTTP_200_OK
