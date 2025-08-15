from django.db import migrations


def update_telegram_social_app(apps, schema_editor):
    SocialApp = apps.get_model('socialaccount', 'SocialApp')
    from django.conf import settings
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        return
    try:
        app = SocialApp.objects.filter(provider='telegram').first()
        if app:
            app.client_id = 'testmarketstartup_bot'
            app.secret = bot_token
            app.save(update_fields=['client_id', 'secret'])
    except Exception:
        pass


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0048_fix_specialists_pk_default'),
        ('socialaccount', '__latest__'),
    ]

    operations = [
        migrations.RunPython(update_telegram_social_app, migrations.RunPython.noop),
    ]


