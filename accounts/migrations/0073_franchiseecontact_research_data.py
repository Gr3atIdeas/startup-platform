from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0072_analysislog_progress_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='franchiseecontact',
            name='research_data',
            field=models.JSONField(blank=True, default=dict, help_text='Deep research logs and enriched data'),
        ),
    ]
