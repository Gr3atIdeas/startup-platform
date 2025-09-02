
from django.db import migrations

def create_telegram_social_app(apps, schema_editor):
    Site = apps.get_model('sites', 'Site')
    SocialApp = apps.get_model('socialaccount', 'SocialApp')

    try:
        site = Site.objects.get(pk=1)
    except Site.DoesNotExist:
        site, _ = Site.objects.get_or_create(domain='www.greatideas.ru', name='www.greatideas.ru')

    bot_token = '7843250850:AAEL8hapR_WVcG2mMNUhWvK-I0DMYG042Ko'

    social_app, created = SocialApp.objects.update_or_create(
        provider='telegram',
        defaults={
            'name': 'Telegram',
            'client_id': bot_token,
            'secret': ''
        }
    )

    social_app.sites.add(site)
    social_app.save()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0014_users_telegram_email_users_telegram_id_and_more'),
        ('socialaccount', '0001_initial'),
        ('sites', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_telegram_social_app),
    ]
