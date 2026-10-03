from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0002_cashoutsession")]

    operations = [
        migrations.AddField(
            model_name="aiconfiguration",
            name="tts_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="aiconfiguration",
            name="tts_model_name",
            field=models.CharField(default="gemini-2.5-flash-preview-tts", max_length=120),
        ),
        migrations.AddField(
            model_name="aiconfiguration",
            name="tts_voice_name",
            field=models.CharField(default="Kore", max_length=80),
        ),
    ]
