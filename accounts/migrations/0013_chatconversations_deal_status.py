
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_chatconversations_is_deal'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatconversations',
            name='deal_status',
            field=models.CharField(choices=[('pending', 'Ожидает'), ('approved', 'Принята'), ('rejected', 'Отклонена')], default='pending', max_length=20),
        ),
    ]
