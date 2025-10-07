from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0056_add_slider_images'),
    ]

    operations = [
        migrations.AddField(
            model_name='startups',
            name='catalog_card_image',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='franchises',
            name='catalog_card_image',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='agencies',
            name='catalog_card_image',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='specialists',
            name='catalog_card_image',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
