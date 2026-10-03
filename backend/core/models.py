import secrets
from decimal import Decimal

from django.conf import settings
from django.db import models


class ApiToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_token")
    key = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    @classmethod
    def issue_for(cls, user):
        token, _ = cls.objects.get_or_create(user=user, defaults={"key": secrets.token_hex(32)})
        token.key = secrets.token_hex(32)
        token.save(update_fields=["key"])
        return token


class AIConfiguration(models.Model):
    PROVIDERS = [("gemini", "Google Gemini"), ("cartesia", "Cartesia")]

    provider = models.CharField(max_length=30, choices=PROVIDERS, default="gemini")
    tts_provider = models.CharField(max_length=30, choices=PROVIDERS, default="gemini")
    cartesia_api_key = models.CharField(max_length=500, blank=True)
    model_name = models.CharField(max_length=120, default="gemini-2.5-flash")
    tts_model_name = models.CharField(max_length=120, default="gemini-2.5-flash-preview-tts")
    tts_voice_name = models.CharField(max_length=80, default="Kore")
    tts_enabled = models.BooleanField(default=True)
    api_key = models.CharField(max_length=500, blank=True)
    system_prompt = models.TextField(
        default=(
            "You are Sohoj Pay's friendly assistant. Reply in simple Bangla unless the user writes in English. "
            "Help explain wallet features, but never claim that you completed a financial transaction. "
            "For any transaction, require the user to review and confirm every field in the app."
        )
    )
    is_enabled = models.BooleanField(default=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def current(cls):
        config, _ = cls.objects.get_or_create(pk=1)
        return config


class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations")
    title = models.CharField(max_length=160, default="New conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ChatMessage(models.Model):
    ROLES = [("user", "User"), ("model", "Model")]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=ROLES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class CashOutSession(models.Model):
    STATES = [
        ("WELCOME", "Welcome"),
        ("CONFIRM_INTENT", "Confirm intent"),
        ("ASK_RECIPIENT", "Ask recipient"),
        ("CONFIRM_RECIPIENT", "Confirm recipient"),
        ("ASK_AMOUNT", "Ask amount"),
        ("CONFIRM_AMOUNT", "Confirm amount"),
        ("REVIEW", "Review"),
        ("COMPLETE", "Complete"),
        ("CANCELLED", "Cancelled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cash_out_sessions")
    state = models.CharField(max_length=30, choices=STATES, default="WELCOME")
    recipient_name = models.CharField(max_length=120, blank=True)
    recipient_number = models.CharField(max_length=30, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    last_transcript = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def fee(self):
        if not self.amount:
            return None
        return (self.amount * Decimal("0.0185")).quantize(Decimal("0.01"))

class KnowledgeDocument(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Contact(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=120)
    number = models.CharField(max_length=30)
    avatar = models.CharField(max_length=5, default="👤")
    type = models.CharField(max_length=50, default="Agent") # e.g. Agent, User
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=50) # e.g. "Send Money", "Cash Out"
    amount = models.CharField(max_length=50)
    recipient = models.CharField(max_length=120)
    date = models.CharField(max_length=50) # e.g. "Today, 10:30 AM" or we can use DateTimeField but to match frontend schema we can just use a string for now, or DateTimeField with frontend formatting. Let's use string for simplicity matching frontend.
    status = models.CharField(max_length=50, default="Success") # e.g. "Success"
    icon = models.CharField(max_length=50, default="transfer")
    color = models.CharField(max_length=50, default="blue")
    created_at = models.DateTimeField(auto_now_add=True)
