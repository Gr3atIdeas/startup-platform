from django.conf import settings

def captcha_keys(request):
    """
    Makes Yandex Smart Captcha site key available in templates.
    """
    return {
        'YANDEX_SMART_CAPTCHA_SITE_KEY': getattr(settings, 'YANDEX_SMART_CAPTCHA_SITE_KEY', None),
    } 