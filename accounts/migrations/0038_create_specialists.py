from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0037_agency_feedback"),
    ]

    operations = [
        migrations.CreateModel(
            name="Specialists",
            fields=[
                ("specialist_id", models.AutoField(primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("short_description", models.TextField(blank=True, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("terms", models.TextField(blank=True, null=True)),
                ("pitch_deck_url", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(blank=True, null=True)),
                ("status", models.CharField(default="pending", max_length=20)),
                ("customization_data", models.JSONField(blank=True, default=dict, null=True)),
                ("total_voters", models.IntegerField(default=0)),
                ("sum_votes", models.IntegerField(default=0)),
                ("logo_urls", models.JSONField(default=list)),
                ("creatives_urls", models.JSONField(blank=True, default=list, null=True)),
                ("proofs_urls", models.JSONField(blank=True, default=list, null=True)),
                ("video_urls", models.JSONField(blank=True, default=list, null=True)),
                ("planet_image", models.CharField(blank=True, max_length=50, null=True)),
                ("additional_info", models.TextField(blank=True, null=True)),
                (
                    "owner",
                    models.ForeignKey(blank=True, null=True, db_column="owner_id", on_delete=django.db.models.deletion.DO_NOTHING, to="accounts.users"),
                ),
                (
                    "direction",
                    models.ForeignKey(blank=True, null=True, db_column="direction_id", on_delete=django.db.models.deletion.DO_NOTHING, to="accounts.directions"),
                ),
                (
                    "stage",
                    models.ForeignKey(blank=True, null=True, db_column="stage_id", on_delete=django.db.models.deletion.DO_NOTHING, to="accounts.startupstages"),
                ),
            ],
            options={
                "db_table": "specialists",
                "managed": True,
            },
        ),
        migrations.CreateModel(
            name="SpecialistVotes",
            fields=[
                ("vote_id", models.AutoField(primary_key=True, serialize=False)),
                ("rating", models.IntegerField(db_column="vote_value")),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(db_column="user_id", on_delete=django.db.models.deletion.CASCADE, to="accounts.users"),
                ),
                (
                    "specialist",
                    models.ForeignKey(blank=True, null=True, db_column="specialist_id", db_constraint=False, on_delete=django.db.models.deletion.CASCADE, to="accounts.specialists"),
                ),
            ],
            options={
                "db_table": "specialist_votes",
                "managed": True,
                "unique_together": {("user", "specialist")},
            },
        ),
        migrations.CreateModel(
            name="SpecialistComments",
            fields=[
                ("comment_id", models.AutoField(primary_key=True, serialize=False)),
                ("content", models.TextField()),
                ("user_rating", models.IntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "specialist",
                    models.ForeignKey(db_column="specialist_id", db_constraint=False, on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="accounts.specialists"),
                ),
                (
                    "user",
                    models.ForeignKey(db_column="user_id", on_delete=django.db.models.deletion.CASCADE, to="accounts.users"),
                ),
                (
                    "parent_comment",
                    models.ForeignKey(blank=True, null=True, db_column="parent_comment_id", on_delete=django.db.models.deletion.CASCADE, to="accounts.specialistcomments"),
                ),
            ],
            options={
                "db_table": "specialist_comments",
                "managed": True,
            },
        ),
    ]


