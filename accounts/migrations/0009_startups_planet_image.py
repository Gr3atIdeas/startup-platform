
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_delete_supportorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='startups',
            name='planet_image',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
