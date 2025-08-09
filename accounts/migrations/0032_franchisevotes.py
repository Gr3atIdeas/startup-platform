from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0030_franchisecomments"),
    ]

    operations = [
        migrations.CreateModel(
            name="FranchiseVotes",
            fields=[
                ("vote_id", models.AutoField(primary_key=True, serialize=False)),
                ("rating", models.IntegerField(db_column="vote_value")),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                (
                    "franchise",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        db_column="franchise_id",
                        to="accounts.franchises",
                        blank=True,
                        null=True,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        db_column="user_id",
                        to="accounts.users",
                    ),
                ),
            ],
            options={
                "db_table": "franchise_votes",
                "managed": True,
                "unique_together": {("user", "franchise")},
            },
        ),
    ]


