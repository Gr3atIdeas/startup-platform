
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0026_add_franchise_fields'),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS franchises CASCADE;",
            reverse_sql="",
        ),
        migrations.CreateModel(
            name='Franchises',
            fields=[
                ('franchise_id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('short_description', models.TextField(blank=True, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('terms', models.TextField(blank=True, null=True)),
                ('investment_size', models.DecimalField(blank=True, decimal_places=4, max_digits=19, null=True)),
                ('payback_period', models.IntegerField(blank=True, null=True)),
                ('own_businesses', models.IntegerField(default=0)),
                ('franchise_businesses', models.IntegerField(default=0)),
                ('valuation', models.DecimalField(blank=True, decimal_places=4, max_digits=19, null=True)),
                ('pitch_deck_url', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(default='pending', max_length=20)),
                ('total_invested', models.DecimalField(blank=True, decimal_places=4, default=0, max_digits=19, null=True)),
                ('info_url', models.CharField(blank=True, max_length=255, null=True)),
                ('percent_amount', models.DecimalField(blank=True, decimal_places=4, max_digits=19, null=True)),
                ('customization_data', models.JSONField(blank=True, null=True)),
                ('total_voters', models.IntegerField(default=0)),
                ('sum_votes', models.IntegerField(default=0)),
                ('is_edited', models.BooleanField(default=False)),
                ('moderator_comment', models.TextField(blank=True, null=True)),
                ('step_number', models.IntegerField(default=1)),
                ('logo_urls', models.JSONField(default=list)),
                ('creatives_urls', models.JSONField(blank=True, default=list, null=True)),
                ('proofs_urls', models.JSONField(blank=True, default=list, null=True)),
                ('video_urls', models.JSONField(blank=True, default=list, null=True)),
                ('planet_image', models.CharField(blank=True, max_length=50, null=True)),
                ('direction', models.ForeignKey(blank=True, db_column='direction_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.directions')),
                ('owner', models.ForeignKey(blank=True, db_column='owner_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.users')),
                ('stage', models.ForeignKey(blank=True, db_column='stage_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.startupstages')),
                ('status_id', models.ForeignKey(blank=True, db_column='status_id', default=3, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.reviewstatuses')),
            ],
            options={
                'db_table': 'franchises',
                'managed': True,
            },
        ),
    ]