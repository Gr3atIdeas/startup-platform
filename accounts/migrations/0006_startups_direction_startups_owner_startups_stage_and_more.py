
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_remove_startups_planet_bottom_color_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='startups',
            name='direction',
            field=models.ForeignKey(blank=True, db_column='direction_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.directions'),
        ),
        migrations.AddField(
            model_name='startups',
            name='owner',
            field=models.ForeignKey(blank=True, db_column='owner_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='startups',
            name='stage',
            field=models.ForeignKey(blank=True, db_column='stage_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.startupstages'),
        ),
        migrations.AddField(
            model_name='startups',
            name='status_id',
            field=models.ForeignKey(blank=True, db_column='status_id', default=3, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.reviewstatuses'),
        ),
        migrations.AddField(
            model_name='users',
            name='show_phone',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='users',
            name='social_links',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='users',
            name='website_url',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
