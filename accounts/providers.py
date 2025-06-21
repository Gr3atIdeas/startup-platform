from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.providers.telegram.provider import TelegramProvider
import requests
import logging
from allauth.socialaccount.models import SocialAccount, SocialLogin
from allauth.socialaccount.helpers import complete_social_login
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

class CustomTelegramAdapter(DefaultSocialAccountAdapter):
    provider_id = TelegramProvider.id

    def complete_login(self, request, app, token, **kwargs):
        logger.debug(f"Complete_login called with app: {app}, token: {token}, kwargs: {kwargs}")
        try:
            api_url = f'https://api.telegram.org/bot{app.client_id}/getMe'
            response = requests.get(api_url)
            if response.status_code == 200:
                data = response.json()
                logger.debug(f"getMe response: {data}")
                user_data = {
                    'id': data.get('result', {}).get('id'),
                    'username': data.get('result', {}).get('username'),
                    'first_name': data.get('result', {}).get('first_name'),
                    'last_name': data.get('result', {}).get('last_name'),
                }
                if user_data.get('id'):
                    logger.info("Successfully fetched user data via getMe")
                    return self._process_social_login(request, app, user_data)
                else:
                    logger.warning("No valid user data in getMe response")
            else:
                logger.warning(f"getMe failed with status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error in getMe request: {str(e)}")

        telegram_data = kwargs.get('response', {})
        logger.debug(f"Telegram data from kwargs: {telegram_data}")
        if telegram_data:
            user_data = {
                'id': telegram_data.get('id'),
                'username': telegram_data.get('username'),
                'first_name': telegram_data.get('first_name'),
                'last_name': telegram_data.get('last_name'),
                'photo_url': telegram_data.get('photo_url'),
            }
            if user_data.get('id'):
                logger.info("Successfully fetched user data from kwargs")
                return self._process_social_login(request, app, user_data)
            else:
                logger.warning("No valid user data in kwargs['response']")

        raise Exception("Failed to fetch user data from Telegram")

    def _process_social_login(self, request, app, user_data):
        User = get_user_model()
        telegram_id = str(user_data['id'])

        try:
            user = User.objects.get(telegram_id=telegram_id)
            logger.info(f"Existing user found: user_id={user.user_id}")
        except ObjectDoesNotExist:
            user = User(
                telegram_id=telegram_id,
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                profile_picture_url=user_data.get('photo_url', ''),
            )
            if user_data.get('username'):
                user.social_links = {'telegram': f"@{user_data.get('username')}"}
            if not user.email:
                user.email = f"{telegram_id}@telegram.com"
                user.telegram_email = user.email
            user.role_id = 4
            user.save()
            logger.info(f"New user created: user_id={user.user_id}")

        social_account, created = SocialAccount.objects.update_or_create(
            provider=self.provider_id,
            uid=telegram_id,
            defaults={'extra_data': user_data}
        )

        sociallogin = SocialLogin(user=user, account=social_account)
        return complete_social_login(request, sociallogin)