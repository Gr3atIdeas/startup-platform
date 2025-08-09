from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0032_franchisevotes"),
    ]

    operations = [
        migrations.CreateModel(
            name="FranchiseDirections",
            fields=[
                ("direction_id", models.AutoField(primary_key=True, serialize=False)),
                ("direction_name", models.CharField(blank=True, max_length=255, null=True, unique=True)),
            ],
            options={
                "db_table": "franchise_directions",
                "managed": True,
            },
        ),
    ]


