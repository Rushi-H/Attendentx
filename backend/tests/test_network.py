import pytest
from rest_framework.test import APIRequestFactory
from apps.offices.services.network import NetworkVerificationService
from apps.offices.models import VerificationMode

@pytest.mark.django_db
class TestNetworkVerification:
    def setup_method(self):
        self.factory = APIRequestFactory()

    def test_approved_ip_matches(self, office):
        request = self.factory.get('/api/v1/attendance/eligibility/', REMOTE_ADDR='223.236.99.39')
        result = NetworkVerificationService.verify(request, office)
        assert result.is_allowed is True
        assert result.reason_code == 'IP_MATCHED'
        assert result.observed_ip == '223.236.99.39'

    def test_unapproved_ip_fails(self, office):
        request = self.factory.get('/api/v1/attendance/eligibility/', REMOTE_ADDR='49.36.12.8')
        result = NetworkVerificationService.verify(request, office)
        assert result.is_allowed is False
        assert result.reason_code == 'IP_MISMATCH'
        assert result.observed_ip == '49.36.12.8'

    def test_proxy_spoofing_defense(self, office, settings):
        # When NUM_PROXIES is 0 (direct connection), fake X-Forwarded-For must be ignored
        settings.NUM_PROXIES = 0
        request = self.factory.get(
            '/api/v1/attendance/eligibility/',
            HTTP_X_FORWARDED_FOR='223.236.99.39',
            REMOTE_ADDR='49.36.12.8'
        )
        result = NetworkVerificationService.verify(request, office)
        # Attacker's fake header is ignored, REMOTE_ADDR is picked
        assert result.observed_ip == '49.36.12.8'
        assert result.is_allowed is False

    def test_trusted_proxy_extraction(self, office, settings):
        # When behind 1 trusted proxy
        settings.NUM_PROXIES = 1
        request = self.factory.get(
            '/api/v1/attendance/eligibility/',
            HTTP_X_FORWARDED_FOR='223.236.99.39',
            REMOTE_ADDR='10.0.0.1'  # Internal proxy IP
        )
        result = NetworkVerificationService.verify(request, office)
        assert result.observed_ip == '223.236.99.39'
        assert result.is_allowed is True

    def test_fail_closed_without_policy(self, office):
        office.network_policy.delete()
        office.refresh_from_db()
        request = self.factory.get('/api/v1/attendance/eligibility/', REMOTE_ADDR='223.236.99.39')
        result = NetworkVerificationService.verify(request, office)
        assert result.is_allowed is False
        assert result.reason_code == 'NO_ACTIVE_POLICY'

    def test_admin_manual_review_mode(self, office):
        policy = office.network_policy
        policy.verification_mode = VerificationMode.ADMIN_MANUAL_REVIEW
        policy.save()

        request = self.factory.get('/api/v1/attendance/eligibility/', REMOTE_ADDR='49.36.12.8')
        result = NetworkVerificationService.verify(request, office)
        assert result.is_allowed is True
        assert result.requires_review is True
        assert result.reason_code == 'FLAGGED_FOR_MANUAL_REVIEW'
