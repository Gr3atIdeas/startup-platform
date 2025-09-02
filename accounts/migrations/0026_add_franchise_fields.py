
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0025_add_franchises_model'),
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