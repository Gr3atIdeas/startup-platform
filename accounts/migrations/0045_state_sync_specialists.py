from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0044_merge_specialists_leaves"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="specialists",
                    name="specialist_id",
                    field=models.AutoField(primary_key=True, db_column="startup_id"),
                ),
            ],
        )
    ]


