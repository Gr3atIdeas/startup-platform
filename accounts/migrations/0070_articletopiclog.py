from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0069_city_franchiselocation"),
    ]

    operations = [
        migrations.CreateModel(
            name="ArticleTopicLog",
            fields=[
                ("topic_id", models.AutoField(primary_key=True, serialize=False)),
                ("article_type", models.CharField(
                    max_length=30,
                    choices=[
                        ("top_category", "Топ франшиз в категории"),
                        ("city_review", "Обзор франшиз в городе"),
                        ("franchise_deep_dive", "Подробный обзор франшизы"),
                        ("cost_overview", "Обзор стоимости франшиз"),
                        ("budget_filter", "Франшизы по бюджету"),
                    ],
                )),
                ("article_type_params", models.JSONField(default=dict)),
                ("param_hash", models.CharField(max_length=64, unique=True, db_index=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("generated_article", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="topic_log",
                    to="accounts.newsarticles",
                )),
            ],
            options={
                "db_table": "article_topic_log",
                "ordering": ["-created_at"],
            },
        ),
    ]
