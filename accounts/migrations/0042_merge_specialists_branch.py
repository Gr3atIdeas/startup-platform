from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0041_merge_seed_specialists"),
        ("accounts", "0040_add_specialists_additional_info"),
        ("accounts", "0040_seed_specialists"),
    ]

    operations = []


