from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0066_news_overhaul"),
    ]

    operations = [
        migrations.CreateModel(
            name="PinnedCatalogItem",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("entity_type", models.CharField(choices=[("startup", "Стартап"), ("franchise", "Франшиза"), ("agency", "Агентство"), ("specialist", "Специалист")], max_length=20, verbose_name="Тип")),
                ("entity_id", models.IntegerField(verbose_name="ID сущности")),
                ("position", models.PositiveSmallIntegerField(verbose_name="Позиция (1-6)")),
                ("is_active", models.BooleanField(default=True, verbose_name="Активно")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "pinned_catalog_items",
                "ordering": ["entity_type", "position"],
                "verbose_name": "Закреплённая карточка",
                "verbose_name_plural": "Закреплённые карточки",
            },
        ),
        migrations.AddConstraint(
            model_name="pinnedcatalogitem",
            constraint=models.UniqueConstraint(fields=["entity_type", "position"], name="uniq_pin_type_pos"),
        ),
        migrations.AddConstraint(
            model_name="pinnedcatalogitem",
            constraint=models.UniqueConstraint(fields=["entity_type", "entity_id"], name="uniq_pin_type_entity"),
        ),
        migrations.AddConstraint(
            model_name="pinnedcatalogitem",
            constraint=models.CheckConstraint(check=models.Q(position__gte=1, position__lte=6), name="chk_pin_position_range"),
        ),
        migrations.CreateModel(
            name="AdPlacement",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("entity_type", models.CharField(choices=[("startup", "Стартап"), ("franchise", "Франшиза"), ("agency", "Агентство"), ("specialist", "Специалист")], max_length=20, verbose_name="Тип сущности")),
                ("entity_id", models.IntegerField(verbose_name="ID сущности")),
                ("location", models.CharField(choices=[("main_under_sidebar", "Главная — под сайдбаром"), ("news_sidebar", "Новости — боковая панель"), ("cosmochat_banner", "CosmoChat — баннер"), ("catalog_sidebar", "Каталог — под фильтрами")], max_length=50, verbose_name="Расположение")),
                ("title", models.CharField(blank=True, max_length=255, verbose_name="Заголовок (переопределить)")),
                ("description", models.TextField(blank=True, verbose_name="Описание (переопределить)")),
                ("is_active", models.BooleanField(default=True, verbose_name="Активно")),
                ("start_date", models.DateField(blank=True, null=True, verbose_name="Начало показа")),
                ("end_date", models.DateField(blank=True, null=True, verbose_name="Конец показа")),
                ("sort_order", models.PositiveSmallIntegerField(default=0, verbose_name="Порядок (0 = первый)")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "ad_placements",
                "ordering": ["location", "sort_order"],
                "verbose_name": "Рекламное размещение",
                "verbose_name_plural": "Рекламные размещения",
            },
        ),
    ]
