# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0055_alter_specialistvotes_specialist'),
    ]

    operations = [
        migrations.AddField(
            model_name='startups',
            name='slider_images',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
        migrations.AddField(
            model_name='franchises',
            name='slider_images',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
        migrations.AddField(
            model_name='agencies',
            name='slider_images',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
        migrations.AddField(
            model_name='specialists',
            name='slider_images',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]
