from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0068_create_lead"),
    ]

    operations = [
        migrations.CreateModel(
            name="City",
            fields=[
                ("city_id", models.AutoField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255, unique=True)),
                ("slug", models.SlugField(blank=True, max_length=280, unique=True)),
                ("region", models.CharField(
                    blank=True, default="", max_length=50,
                    choices=[
                        ("central", "Центральный"),
                        ("northwest", "Северо-Западный"),
                        ("south", "Южный"),
                        ("volga", "Приволжский"),
                        ("ural", "Уральский"),
                        ("siberia", "Сибирский"),
                        ("far_east", "Дальневосточный"),
                        ("caucasus", "Северо-Кавказский"),
                    ],
                )),
                ("population", models.IntegerField(blank=True, null=True, help_text="Население города")),
                ("is_major", models.BooleanField(default=False, help_text="Город-миллионник")),
            ],
            options={
                "db_table": "cities",
                "ordering": ["name"],
                "verbose_name_plural": "Cities",
            },
        ),
        migrations.CreateModel(
            name="FranchiseLocation",
            fields=[
                ("location_id", models.AutoField(primary_key=True, serialize=False)),
                ("status", models.CharField(
                    default="active", max_length=20,
                    choices=[("active", "Активна"), ("planned", "Планируется"), ("closed", "Закрыта")],
                )),
                ("opened_at", models.DateField(blank=True, null=True, help_text="Дата открытия")),
                ("monthly_revenue", models.DecimalField(
                    blank=True, decimal_places=2, max_digits=15, null=True,
                    help_text="Средняя месячная выручка (руб)",
                )),
                ("monthly_profit", models.DecimalField(
                    blank=True, decimal_places=2, max_digits=15, null=True,
                    help_text="Средняя месячная прибыль (руб)",
                )),
                ("initial_investment", models.DecimalField(
                    blank=True, decimal_places=2, max_digits=15, null=True,
                    help_text="Начальные инвестиции в эту точку (руб)",
                )),
                ("note", models.TextField(blank=True, default="", help_text="Комментарий к точке")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("city", models.ForeignKey(
                    db_column="city_id",
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="franchise_locations",
                    to="accounts.city",
                )),
                ("franchise", models.ForeignKey(
                    db_column="franchise_id",
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="locations",
                    to="accounts.franchises",
                )),
            ],
            options={
                "db_table": "franchise_locations",
                "ordering": ["-opened_at"],
                "unique_together": {("franchise", "city")},
                "indexes": [
                    models.Index(fields=["franchise", "status"], name="idx_fl_franchise_status"),
                    models.Index(fields=["city"], name="idx_fl_city"),
                ],
            },
        ),
    ]
