import pytest
from rest_framework import status
from apps.attendance.models import AttendanceRecord, AttendanceAttempt, AttendanceStatus

@pytest.mark.django_db
class TestAttendanceEngine:
    def test_check_in_approved_ip(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        # 127.0.0.1 is in the test allowlist fixture
        response = api_client.post('/api/v1/attendance/check-in/', REMOTE_ADDR='127.0.0.1')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert response.data['data']['attendance_status'] in (AttendanceStatus.PRESENT, AttendanceStatus.LATE)

    def test_duplicate_check_in_rejected(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        # First check-in
        api_client.post('/api/v1/attendance/check-in/', REMOTE_ADDR='127.0.0.1')
        # Second check-in
        response = api_client.post('/api/v1/attendance/check-in/', REMOTE_ADDR='127.0.0.1')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already been marked' in str(response.data)

    def test_check_in_unapproved_ip_fails(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        response = api_client.post('/api/v1/attendance/check-in/', REMOTE_ADDR='198.51.100.22')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Network verification failed' in str(response.data)

        # Confirm attempt was logged
        attempt = AttendanceAttempt.objects.filter(employee=employee_user.employee_profile).first()
        assert attempt is not None
        assert attempt.verification_result == 'REJECTED'
        assert attempt.reason_code == 'IP_MISMATCH'

    def test_check_out_workflow(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        # Check in first
        api_client.post('/api/v1/attendance/check-in/', REMOTE_ADDR='127.0.0.1')
        # Check out
        response = api_client.post('/api/v1/attendance/check-out/', REMOTE_ADDR='127.0.0.1')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['check_out_at'] is not None

    def test_check_out_without_check_in_fails(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        response = api_client.post('/api/v1/attendance/check-out/', REMOTE_ADDR='127.0.0.1')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'must check in first' in str(response.data)

    def test_admin_manual_correction(self, api_client, superuser, employee_user):
        # Create an attendance record
        api_client.force_authenticate(user=employee_user)
        res = api_client.post('/api/v1/attendance/check-in/', REMOTE_ADDR='127.0.0.1')
        record_id = res.data['data']['id']

        # Super admin performs correction
        api_client.force_authenticate(user=superuser)
        correction_res = api_client.patch(f'/api/v1/attendance/admin/{record_id}/', {
            'attendance_status': AttendanceStatus.PRESENT,
            'correction_reason': 'Employee attendance machine sync delay'
        })
        assert correction_res.status_code == status.HTTP_200_OK
        assert correction_res.data['data']['is_manual_correction'] is True
        assert correction_res.data['data']['correction_reason'] == 'Employee attendance machine sync delay'

    def test_employee_cannot_correct_attendance(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        res = api_client.post('/api/v1/attendance/check-in/', REMOTE_ADDR='127.0.0.1')
        record_id = res.data['data']['id']

        correction_res = api_client.patch(f'/api/v1/attendance/admin/{record_id}/', {
            'attendance_status': AttendanceStatus.PRESENT,
            'correction_reason': 'Self-correction attempt'
        })
        assert correction_res.status_code == status.HTTP_403_FORBIDDEN
