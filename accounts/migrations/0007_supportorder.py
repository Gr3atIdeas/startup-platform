
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_startups_direction_startups_owner_startups_stage_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='SupportOrder',
            fields=[
                ('order_id', models.AutoField(primary_key=True, serialize=False)),
                ('role', models.CharField(choices=[('investor', 'Инвестор'), ('startuper', 'Стартапер'), ('moderator', 'Модератор')], max_length=50)),
                ('subject', models.CharField(max_length=255)),
                ('name', models.CharField(max_length=100)),
                ('telegram', models.CharField(max_length=50)),
                ('comment', models.TextField(max_length=500)),
                ('status', models.CharField(choices=[('open', 'Открыта'), ('closed', 'Закрыта')], default='open', max_length=20)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='support_orders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'support_orders',
                'managed': True,
            },
        ),
    ]
