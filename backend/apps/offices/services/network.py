import ipaddress
import logging
from django.conf import settings
from django.utils import timezone
from apps.offices.models import NetworkPolicy, VerificationMode

logger = logging.getLogger(__name__)

class NetworkVerificationResult:
    def __init__(self, is_allowed, verification_method, reason_code, observed_ip, policy_id=None, office_name=None, requires_review=False):
        self.is_allowed = is_allowed
        self.verification_method = verification_method
        self.reason_code = reason_code
        self.observed_ip = observed_ip
        self.policy_id = str(policy_id) if policy_id else None
        self.office_name = office_name
        self.requires_review = requires_review
        self.verified_at = timezone.now().isoformat()

    def to_dict(self):
        return {
            'is_allowed': self.is_allowed,
            'verification_method': self.verification_method,
            'reason_code': self.reason_code,
            'observed_ip': self.observed_ip,
            'policy_id': self.policy_id,
            'office_name': self.office_name,
            'requires_review': self.requires_review,
            'verified_at': self.verified_at,
        }

class NetworkVerificationService:
    @staticmethod
    def get_client_ip(request):
        """
        Derives the client IP securely.
        Uses NUM_PROXIES to prevent forged X-Forwarded-For headers.
        """
        num_proxies = getattr(settings, 'NUM_PROXIES', 0)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for and num_proxies > 0:
            parts = [p.strip() for p in x_forwarded_for.split(',')]
            if len(parts) >= num_proxies:
                client_ip = parts[-num_proxies]
                return client_ip

        # Direct remote address fallback
        remote_addr = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return remote_addr

    @classmethod
    def verify(cls, request, office, action='CHECK_IN'):
        """
        Evaluates the network policy for an office against the incoming HTTP request.
        Returns a NetworkVerificationResult.
        """
        observed_ip = cls.get_client_ip(request)

        if not office:
            return NetworkVerificationResult(
                is_allowed=False,
                verification_method='NONE',
                reason_code='NO_OFFICE_ASSIGNED',
                observed_ip=observed_ip,
                requires_review=False
            )

        policy = getattr(office, 'network_policy', None)
        if not policy or not policy.is_active:
            # Fail closed: No active policy means attendance cannot be verified
            return NetworkVerificationResult(
                is_allowed=False,
                verification_method='NONE',
                reason_code='NO_ACTIVE_POLICY',
                observed_ip=observed_ip,
                office_name=office.name,
                requires_review=False
            )

        mode = policy.verification_mode

        # DEVELOPMENT_MOCK mode
        if mode == VerificationMode.DEVELOPMENT_MOCK:
            if not settings.DEBUG:
                logger.critical("DEVELOPMENT_MOCK verification mode cannot be used when DEBUG=False!")
                return NetworkVerificationResult(
                    is_allowed=False,
                    verification_method=mode,
                    reason_code='MOCK_FORBIDDEN_IN_PRODUCTION',
                    observed_ip=observed_ip,
                    policy_id=policy.id,
                    office_name=office.name
                )
            mock_ip = request.META.get('HTTP_X_MOCK_IP', observed_ip)
            return NetworkVerificationResult(
                is_allowed=True,
                verification_method=mode,
                reason_code='MOCK_DEVELOPMENT_ALLOWED',
                observed_ip=mock_ip,
                policy_id=policy.id,
                office_name=office.name
            )

        # ADMIN_MANUAL_REVIEW mode
        if mode == VerificationMode.ADMIN_MANUAL_REVIEW:
            return NetworkVerificationResult(
                is_allowed=True,
                verification_method=mode,
                reason_code='FLAGGED_FOR_MANUAL_REVIEW',
                observed_ip=observed_ip,
                policy_id=policy.id,
                office_name=office.name,
                requires_review=True
            )

        # STRICT_IP_ALLOWLIST mode
        if mode == VerificationMode.STRICT_IP_ALLOWLIST:
            ip_matched = cls._is_ip_in_allowlist(observed_ip, policy.allowed_ip_ranges)
            if ip_matched:
                return NetworkVerificationResult(
                    is_allowed=True,
                    verification_method=mode,
                    reason_code='IP_MATCHED',
                    observed_ip=observed_ip,
                    policy_id=policy.id,
                    office_name=office.name
                )
            else:
                return NetworkVerificationResult(
                    is_allowed=False,
                    verification_method=mode,
                    reason_code='IP_MISMATCH',
                    observed_ip=observed_ip,
                    policy_id=policy.id,
                    office_name=office.name
                )

        # Unrecognized mode
        return NetworkVerificationResult(
            is_allowed=False,
            verification_method='UNKNOWN',
            reason_code='UNSUPPORTED_VERIFICATION_MODE',
            observed_ip=observed_ip,
            policy_id=policy.id,
            office_name=office.name
        )

    @staticmethod
    def _is_ip_in_allowlist(client_ip_str, allowed_ranges):
        """
        Safely validates if client_ip_str is covered by any CIDR or single IP in allowed_ranges.
        Supports both IPv4 and IPv6.
        """
        try:
            client_ip = ipaddress.ip_address(client_ip_str)
        except ValueError:
            return False

        for net_str in allowed_ranges:
            try:
                # If network without mask, /32 or /128 is inferred by ip_network with strict=False
                network = ipaddress.ip_network(net_str.strip(), strict=False)
                if client_ip in network:
                    return True
            except ValueError:
                continue

        return False
