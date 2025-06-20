from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.providers.telegram.provider import TelegramProvider
import requests

class CustomTelegramAdapter(DefaultSocialAccountAdapter):
    provider_id = TelegramProvider.id

    def complete_login(self, request, app, token, **kwargs):
        # Получаем данные пользователя через Telegram API
        api_url = f'https://api.telegram.org/bot{app.client_id}/getMe'
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()
            # Простая обработка данных (нужно адаптировать под вашу модель Users)
            user_data = {
                'id': data.get('result', {}).get('id'),
                'username': data.get('result', {}).get('username'),
                'first_name': data.get('result', {}).get('first_name'),
                'last_name': data.get('result', {}).get('last_name'),
            }
            from allauth.socialaccount.helpers import complete_social_login
            return complete_social_login(request, app, user_data)
        else:
            raise Exception("Failed to fetch user data from Telegram API")