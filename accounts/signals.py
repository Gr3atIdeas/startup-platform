from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver
from .models import Users
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@receiver(social_account_added)
def handle_telegram_login(request, sociallogin, **kwargs):
    if sociallogin.account.provider != 'telegram':
        return

    telegram_data = sociallogin.account.extra_data
    user = sociallogin.user
    
    logger.debug(f"Received Telegram data in signal: {telegram_data}")
    logger.debug(f"User before update: {user.__dict__}")

    # Обновляем только для нового пользователя
    user.telegram_id = str(telegram_data.get('id', '') or '')
    user.first_name = telegram_data.get('first_name', '') or ''
    user.last_name = telegram_data.get('last_name', '') or ''
    user.profile_picture_url = telegram_data.get('photo_url', '') or ''
    
    if telegram_data.get('username'):
        user.social_links = {'telegram': f"@{telegram_data.get('username')}"}

    if not user.email:
        user.email = f"{user.telegram_id}@telegram.com"
        user.telegram_email = user.email

    if not user.role_id:
        user.role_id = 1  # Default role

    user.last_login = timezone.now()
    
    user.save()
    logger.info(f"Telegram user processed and saved: user_id={user.user_id}, telegram_id={user.telegram_id}, social_links={user.social_links}")