from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0029_add_franchise_fields_only"),
    ]

    operations = [
        migrations.CreateModel(
            name="FranchiseComments",
            fields=[
                ("comment_id", models.AutoField(primary_key=True, serialize=False)),
                ("content", models.TextField()),
                ("user_rating", models.IntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "franchise",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comments",
                        db_column="franchise_id",
                        to="accounts.franchises",
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
                        null=True,
                        blank=True,
                        db_column="parent_comment_id",
                        to="accounts.franchisecomments",
                    ),
                ),
            ],
            options={
                "db_table": "franchise_comments",
                "managed": True,
            },
        ),
    ]


