
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0028_add_franchise_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='franchises',
            name='franchise_businesses_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='franchises',
            name='franchise_cost',
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=19, null=True),
        ),
        migrations.AddField(
            model_name='franchises',
            name='own_businesses_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='franchises',
            name='profit_calculation',
            field=models.TextField(blank=True, null=True),
        ),
    ]
