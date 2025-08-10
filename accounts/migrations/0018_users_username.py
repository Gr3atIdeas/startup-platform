
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0017_alter_users_email_alter_users_social_links'),
    ]

    operations = [
        migrations.AddField(
            model_name='users',
            name='username',
            field=models.CharField(blank=True, max_length=150, null=True, unique=True),
        ),
    ]
