from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.providers.telegram.provider import TelegramProvider
import logging
from allauth.socialaccount.models import SocialAccount, SocialLogin
from allauth.socialaccount.helpers import complete_social_login
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

class CustomTelegramAdapter(DefaultSocialAccountAdapter):
    provider_id = TelegramProvider.id

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        logger.debug(f"CustomTelegramAdapter initialized with provider_id: {self.provider_id}")

    def complete_login(self, request, app, token, **kwargs):
        logger.debug(f"Complete_login called with app: {app}, token: {token}, kwargs: {kwargs}")
        telegram_data = kwargs.get('response', {})
        logger.debug(f"Received Telegram data: {telegram_data}")

        if not telegram_data or 'id' not in telegram_data:
            logger.error("No valid Telegram data received: {telegram_data}")
            raise Exception("Invalid Telegram authentication data")

        user_data = {
            'id': str(telegram_data.get('id')),
            'username': telegram_data.get('username'),
            'first_name': telegram_data.get('first_name'),
            'last_name': telegram_data.get('last_name', ''),
            'photo_url': telegram_data.get('photo_url'),
        }
        logger.info(f"Processed user data: {user_data}")

        return self._process_social_login(request, app, user_data)

    def _process_social_login(self, request, app, user_data):
        User = get_user_model()
        telegram_id = user_data['id']

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
        logger.debug(f"Completing social login for user_id={user.user_id}")
        return complete_social_login(request, sociallogin)