from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0074_lead_messenger_and_city_text'),
    ]

    operations = [
        migrations.AddField(
            model_name='franchises',
            name='excluded_cities',
            field=models.ManyToManyField(
                blank=True,
                help_text='Города, в которых франшиза НЕ доступна для открытия',
                related_name='excluded_franchises',
                to='accounts.city',
            ),
        ),
    ]
