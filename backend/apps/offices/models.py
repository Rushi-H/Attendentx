import uuid
from django.db import models

class VerificationMode(models.TextChoices):
    STRICT_IP_ALLOWLIST = 'STRICT_IP_ALLOWLIST', 'Strict IP Allowlist'
    MANAGED_NETWORK_VERIFICATION = 'MANAGED_NETWORK_VERIFICATION', 'Managed Network Verification'
    DEVELOPMENT_MOCK = 'DEVELOPMENT_MOCK', 'Development Mock'
    ADMIN_MANUAL_REVIEW = 'ADMIN_MANUAL_REVIEW', 'Admin Manual Review'

class Office(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    timezone = models.CharField(max_length=64, default='Asia/Kolkata')
    address = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'offices'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.timezone})"

class NetworkPolicy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    office = models.OneToOneField(
        Office,
        on_delete=models.CASCADE,
        related_name='network_policy'
    )
    verification_mode = models.CharField(
        max_length=40,
        choices=VerificationMode.choices,
        default=VerificationMode.STRICT_IP_ALLOWLIST
    )
    # Stored as a list of strings: ["223.236.99.39/32", "192.168.1.0/24"]
    allowed_ip_ranges = models.JSONField(default=list)
    strict_mode_enabled = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'network_policies'
        verbose_name = 'Network Policy'
        verbose_name_plural = 'Network Policies'

    def __str__(self):
        return f"Policy for {self.office.name} [{self.verification_mode}]"

class Holiday(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='holidays',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=120)
    date = models.DateField(db_index=True)
    is_recurring = models.BooleanField(default=False)

    class Meta:
        db_table = 'holidays'
        ordering = ['date']
        unique_together = ('office', 'date', 'name')

    def __str__(self):
        return f"{self.name} ({self.date})"
