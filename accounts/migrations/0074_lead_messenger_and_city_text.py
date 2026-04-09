from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0073_franchiseecontact_research_data"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="messenger",
            field=models.CharField(
                blank=True, default="", max_length=255,
                help_text="Telegram, WhatsApp или другой мессенджер",
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="target_city_text",
            field=models.CharField(
                blank=True, default="", max_length=255,
                help_text="Город (свободный ввод)",
            ),
        ),
    ]
