from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0036_create_agencies"),
    ]

    operations = [
        migrations.CreateModel(
            name="AgencyVotes",
            fields=[
                ("vote_id", models.AutoField(primary_key=True, serialize=False)),
                ("rating", models.IntegerField(db_column="vote_value")),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        db_column="user_id",
                        to="accounts.users",
                    ),
                ),
                (
                    "agency",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        db_column="agency_id",
                        blank=True,
                        null=True,
                        to="accounts.agencies",
                    ),
                ),
            ],
            options={
                "db_table": "agency_votes",
                "managed": True,
                "unique_together": {("user", "agency")},
            },
        ),
        migrations.CreateModel(
            name="AgencyComments",
            fields=[
                ("comment_id", models.AutoField(primary_key=True, serialize=False)),
                ("content", models.TextField()),
                ("user_rating", models.IntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "agency",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comments",
                        db_column="agency_id",
                        to="accounts.agencies",
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
                (
                    "parent_comment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        db_column="parent_comment_id",
                        blank=True,
                        null=True,
                        to="accounts.agencycomments",
                    ),
                ),
            ],
            options={
                "db_table": "agency_comments",
                "managed": True,
            },
        ),
    ]


