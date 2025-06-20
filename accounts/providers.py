from allauth.socialaccount.adapter import OAuth2Adapter
from allauth.socialaccount.providers.telegram.provider import TelegramProvider

class CustomTelegramAdapter(OAuth2Adapter):
    provider_id = TelegramProvider.id
    access_token_url = 'https://api.telegram.org/bot{}/getMe'.format(TelegramProvider.id)
    authorize_url = 'https://oauth.telegram.org/auth'
    profile_url = 'https://api.telegram.org/bot{}/getUserProfilePhotos'.format(TelegramProvider.id)

    def complete_login(self, request, app, token, **kwargs):
        # Минимальная реализация для совместимости с 0.61.1
        from allauth.socialaccount.helpers import complete_social_login
        return complete_social_login(request, app)