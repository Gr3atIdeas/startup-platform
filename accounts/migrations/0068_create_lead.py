from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0067_pinned_and_ads"),
    ]

    operations = [
        migrations.CreateModel(
            name="Lead",
            fields=[
                ("lead_id", models.AutoField(primary_key=True, serialize=False)),
                ("entity_type", models.CharField(
                    choices=[("startup", "Стартап"), ("franchise", "Франшиза"), ("agency", "Агентство"), ("specialist", "Специалист")],
                    max_length=20,
                )),
                ("entity_id", models.IntegerField()),
                ("lead_type", models.CharField(
                    choices=[("invest", "Инвестиция"), ("franchise_info", "Информация о франшизе"), ("quote", "Запрос расчёта"), ("consultation", "Консультация")],
                    max_length=20,
                )),
                ("name", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=255)),
                ("phone", models.CharField(blank=True, default="", max_length=50)),
                ("budget_range", models.CharField(
                    blank=True, default="", max_length=100,
                    choices=[("", "Не указан"), ("до 500К", "до 500 000 ₽"), ("500К-1М", "500 000 — 1 000 000 ₽"), ("1М-5М", "1 000 000 — 5 000 000 ₽"), ("5М-10М", "5 000 000 — 10 000 000 ₽"), ("10М+", "более 10 000 000 ₽")],
                )),
                ("message", models.TextField(blank=True, default="")),
                ("status", models.CharField(
                    choices=[("new", "Новая"), ("viewed", "Просмотрена"), ("responded", "Отвечено"), ("converted", "Конвертирована")],
                    default="new", max_length=20,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("viewed_at", models.DateTimeField(blank=True, null=True)),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                ("entity_owner", models.ForeignKey(
                    blank=True, db_column="entity_owner_id", null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="received_leads",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("user", models.ForeignKey(
                    blank=True, db_column="user_id", null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="submitted_leads",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "db_table": "leads",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["entity_type", "entity_id"], name="idx_leads_entity"),
                    models.Index(fields=["entity_owner", "status"], name="idx_leads_owner_status"),
                ],
            },
        ),
    ]
