from django.db import migrations


def update_telegram_social_app_config(apps, schema_editor):
    SocialApp = apps.get_model('socialaccount', 'SocialApp')
    from django.conf import settings
    
    hardcoded_token = '7843250850:AAEL8hapR_WVcG2mMNUhWvK-I0DMYG042Ko'
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    
    try:
        app = SocialApp.objects.filter(provider='telegram').first()
        if app:
            if app.client_id == hardcoded_token:
                app.client_id = 'greatideas_tg_bot'
                app.save(update_fields=['client_id'])
            
            if bot_token and app.secret != bot_token:
                app.secret = bot_token
                app.save(update_fields=['secret'])
    except Exception:
        pass


def reverse_update_config(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0057_add_catalog_card_image'),
        ('socialaccount', '__latest__'),
    ]

    operations = [
        migrations.RunPython(update_telegram_social_app_config, reverse_update_config),
    ]

