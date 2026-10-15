import pytest
from rest_framework import status

@pytest.mark.django_db
class TestReports:
    def test_admin_can_access_summary(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/v1/reports/attendance/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'kpis' in response.data['data']

    def test_employee_cannot_access_reports(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        response = api_client.get('/api/v1/reports/attendance/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_csv_export(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/v1/reports/export/?format=csv')
        assert response.status_code == status.HTTP_200_OK
        assert 'text/csv' in response['Content-Type']
        assert 'attendance_report.csv' in response['Content-Disposition']

    def test_excel_export(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/v1/reports/export/?format=excel')
        assert response.status_code == status.HTTP_200_OK
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response['Content-Type']

    def test_monthly_matrix_report(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/v1/reports/monthly/?month=10&year=2026')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'employees' in response.data['data']

    def test_late_arrivals_report(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/v1/reports/late-arrivals/?days=30')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data['data'], list)

    def test_superadmin_can_access_audit_logs(self, api_client, superuser):
        api_client.force_authenticate(user=superuser)
        response = api_client.get('/api/v1/audit/logs/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_employee_cannot_access_audit_logs(self, api_client, employee_user):
        api_client.force_authenticate(user=employee_user)
        response = api_client.get('/api/v1/audit/logs/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
