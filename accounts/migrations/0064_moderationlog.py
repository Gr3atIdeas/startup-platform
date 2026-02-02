from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0063_add_performance_indexes"),
    ]

    operations = [
        migrations.CreateModel(
            name="ModerationLog",
            fields=[
                ("log_id", models.AutoField(primary_key=True, serialize=False)),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("approve", "Одобрено"),
                            ("reject", "Отклонено"),
                            ("delete_comment", "Комментарий удалён"),
                            ("edit", "Отредактировано"),
                            ("status_change", "Статус изменён"),
                        ],
                        max_length=30,
                    ),
                ),
                (
                    "entity_type",
                    models.CharField(
                        choices=[
                            ("startup", "Стартап"),
                            ("franchise", "Франшиза"),
                            ("agency", "Агентство"),
                            ("specialist", "Специалист"),
                            ("comment", "Комментарий"),
                        ],
                        max_length=30,
                    ),
                ),
                ("entity_id", models.IntegerField()),
                ("entity_title", models.CharField(blank=True, default="", max_length=255)),
                ("comment", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "moderator",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="moderation_logs",
                        to="accounts.users",
                    ),
                ),
            ],
            options={
                "db_table": "moderation_log",
                "ordering": ["-created_at"],
                "managed": True,
            },
        ),
        migrations.AddIndex(
            model_name="moderationlog",
            index=models.Index(fields=["-created_at"], name="idx_modlog_created"),
        ),
        migrations.AddIndex(
            model_name="moderationlog",
            index=models.Index(fields=["moderator", "-created_at"], name="idx_modlog_moderator"),
        ),
        migrations.AddIndex(
            model_name="moderationlog",
            index=models.Index(fields=["entity_type", "entity_id"], name="idx_modlog_entity"),
        ),
    ]
