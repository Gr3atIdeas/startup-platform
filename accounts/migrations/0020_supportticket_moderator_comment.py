
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0019_supportticket'),
    ]

    operations = [
        migrations.AddField(
            model_name='supportticket',
            name='moderator_comment',
            field=models.TextField(blank=True, null=True),
        ),
    ]