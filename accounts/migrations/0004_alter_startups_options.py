
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_uservotes_table'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='startups',
            options={'managed': True},
        ),
    ]
