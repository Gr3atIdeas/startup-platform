
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_supportorder'),
    ]

    operations = [
        migrations.DeleteModel(
            name='SupportOrder',
        ),
    ]
