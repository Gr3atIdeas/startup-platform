# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0024_add_vk_linkedin_to_users_only'),
    ]

    operations = [
        migrations.AddField(
            model_name='comments',
            name='user_rating',
            field=models.IntegerField(blank=True, null=True),
        ),
    ] 