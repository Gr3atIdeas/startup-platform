
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_startups_planet_image'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='chatconversations',
            options={'managed': True},
        ),
    ]
