from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CashOutSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("state", models.CharField(choices=[("WELCOME", "Welcome"), ("CONFIRM_INTENT", "Confirm intent"), ("ASK_RECIPIENT", "Ask recipient"), ("CONFIRM_RECIPIENT", "Confirm recipient"), ("ASK_AMOUNT", "Ask amount"), ("CONFIRM_AMOUNT", "Confirm amount"), ("REVIEW", "Review"), ("COMPLETE", "Complete"), ("CANCELLED", "Cancelled")], default="WELCOME", max_length=30)),
                ("recipient_name", models.CharField(blank=True, max_length=120)),
                ("recipient_number", models.CharField(blank=True, max_length=30)),
                ("amount", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("last_transcript", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cash_out_sessions", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
