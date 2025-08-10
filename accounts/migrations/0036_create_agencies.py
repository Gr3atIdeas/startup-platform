from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0035_seed_franchise_directions"),
    ]

    operations = [
        migrations.CreateModel(
            name="Agencies",
            fields=[
                ("agency_id", models.AutoField(primary_key=True, serialize=False)),
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
            ],
            options={
                "db_table": "agencies",
                "managed": True,
            },
        ),
    ]


