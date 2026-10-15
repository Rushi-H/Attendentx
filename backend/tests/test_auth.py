import pytest
from rest_framework import status

@pytest.mark.django_db
class TestAuthentication:
    def test_csrf_endpoint(self, api_client):
        response = api_client.get('/api/v1/auth/csrf/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'csrfToken' in response.data['data']

    def test_successful_login(self, api_client, employee_user):
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'alex@company.com',
            'password': 'TestPassword123!'
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['email'] == 'alex@company.com'
        assert response.data['data']['role'] == 'EMPLOYEE'
        assert response.data['data']['employee_profile']['employee_code'] == 'EMP-2001'

    def test_invalid_password_login(self, api_client, employee_user):
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'alex@company.com',
            'password': 'WrongPassword!'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False

    def test_deactivated_user_login(self, api_client, employee_user):
        employee_user.is_active = False
        employee_user.save()
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'alex@company.com',
            'password': 'TestPassword123!'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'deactivated' in str(response.data)

    def test_current_user_me(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        response = api_client.get('/api/v1/auth/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['email'] == 'alex@company.com'

    def test_unauthenticated_me_rejected(self, api_client):
        response = api_client.get('/api/v1/auth/me/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_change_password(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        response = api_client.post('/api/v1/auth/change-password/', {
            'old_password': 'TestPassword123!',
            'new_password': 'BrandNewPassword123!'
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

        # Verify new password works
        employee_user.refresh_from_db()
        assert employee_user.check_password('BrandNewPassword123!') is True

    def test_password_reset_workflow(self, api_client, employee_user):
        # 1. Request reset token
        reset_req = api_client.post('/api/v1/auth/password-reset/', {
            'email': 'alex@company.com'
        })
        assert reset_req.status_code == status.HTTP_200_OK
        assert 'token' in reset_req.data['data']
        token = reset_req.data['data']['token']
        uidb64 = reset_req.data['data']['uidb64']

        # 2. Confirm reset
        confirm_res = api_client.post('/api/v1/auth/password-reset-confirm/', {
            'uidb64': uidb64,
            'token': token,
            'new_password': 'ResetSuccessful123!'
        })
        assert confirm_res.status_code == status.HTTP_200_OK
        assert confirm_res.data['success'] is True

        employee_user.refresh_from_db()
        assert employee_user.check_password('ResetSuccessful123!') is True

    def test_admin_user_status_toggle(self, api_client, superuser, employee_user):
        api_client.force_authenticate(user=superuser)
        # Deactivate
        res = api_client.patch(f'/api/v1/auth/users/{employee_user.id}/status/', {
            'is_active': False,
            'reason': 'Employee suspended pending inquiry'
        })
        assert res.status_code == status.HTTP_200_OK
        assert res.data['data']['is_active'] is False

        employee_user.refresh_from_db()
        assert employee_user.is_active is False
        assert employee_user.employee_profile.employment_status == 'SUSPENDED'

    def test_unauthorized_status_toggle_rejected(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        res = api_client.patch(f'/api/v1/auth/users/{employee_user.id}/status/', {
            'is_active': False
        })
        assert res.status_code == status.HTTP_403_FORBIDDEN
