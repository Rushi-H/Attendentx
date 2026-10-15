import json
import logging
from django.core.serializers.json import DjangoJSONEncoder
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    def _clean_json(val):
        if val is None:
            return {}
        try:
            return json.loads(json.dumps(val, cls=DjangoJSONEncoder))
        except Exception:
            return str(val)

    @classmethod
    def log_action(cls, actor, action, entity_type, entity_id, old_values=None, new_values=None, reason="", ip_address=None):
        """
        Creates an immutable audit record for compliance and tracking.
        """
        try:
            return AuditLog.objects.create(
                actor=actor if actor and actor.is_authenticated else None,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id),
                old_values=cls._clean_json(old_values),
                new_values=cls._clean_json(new_values),
                reason=reason,
                ip_address=ip_address
            )
        except Exception as e:
            logger.error(f"Failed to record audit log: {str(e)}", exc_info=True)
            return None

