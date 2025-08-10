
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0016_update_site_domain'),
    ]

    operations = [
        migrations.AlterField(
            model_name='users',
            name='email',
            field=models.EmailField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='users',
            name='social_links',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
    ]
