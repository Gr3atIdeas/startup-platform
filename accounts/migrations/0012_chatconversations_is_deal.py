
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_chatconversations_is_group_chat'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatconversations',
            name='is_deal',
            field=models.BooleanField(default=False),
        ),
    ]
