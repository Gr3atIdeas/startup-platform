from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):

    def get_connect_redirect_url(self, request, socialaccount):
        """
        Переопределяем метод, чтобы принудительно использовать WWW для домена.
        Это гарантирует, что Telegram получит правильный `redirect_uri`.
        """
        # Получаем стандартный URL, который сгенерировал бы allauth
        url = super().get_connect_redirect_url(request, socialaccount)

        # Если мы в продакшене и URL содержит наш домен без 'www', исправляем его
        if not settings.DEBUG and '://greatideas.ru' in url:
            url = url.replace('://greatideas.ru', '://www.greatideas.ru')
            
        return url 