
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0020_supportticket_moderator_comment'),
    ]

    operations = [
        migrations.AddField(
            model_name='filestorage',
            name='original_file_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterModelOptions(
            name='filestorage',
            options={'managed': True},
        ),
    ]