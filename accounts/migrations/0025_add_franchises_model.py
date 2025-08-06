# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0024_add_vk_linkedin_to_users_only'),
    ]

    operations = [
        migrations.AddField(
            model_name='franchises',
            name='investment_size',
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=19, null=True),
        ),
        migrations.AddField(
            model_name='franchises',
            name='payback_period',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='franchises',
            name='own_businesses',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='franchises',
            name='franchise_businesses',
            field=models.IntegerField(default=0),
        ),
    ] 