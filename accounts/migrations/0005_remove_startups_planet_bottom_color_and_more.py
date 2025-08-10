
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_alter_startups_options"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="startups",
            name="planet_bottom_color",
        ),
        migrations.RemoveField(
            model_name="startups",
            name="planet_middle_color",
        ),
        migrations.RemoveField(
            model_name="startups",
            name="planet_top_color",
        ),
        migrations.AddField(
            model_name="startups",
            name="short_description",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="startups",
            name="terms",
            field=models.TextField(blank=True, null=True),
        ),
    ]
