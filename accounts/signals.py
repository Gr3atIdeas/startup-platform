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
    
    logger.debug(f"Received Telegram data for user {user.email}: {telegram_data}")

    # The user is being created via social account for the first time.
    # allauth has created a user instance, let's populate it with telegram data.
    
    user.telegram_id = str(telegram_data.get('id', ''))
    user.first_name = telegram_data.get('first_name', '')
    user.last_name = telegram_data.get('last_name', '')
    user.profile_picture_url = telegram_data.get('photo_url', '')
    
    if telegram_data.get('username'):
        user.social_links = {'telegram': f"@{telegram_data.get('username')}"}

    # allauth might not assign an email if it's not provided.
    # Our user model might require it (it allows null but unique).
    if not user.email:
        user.email = f"{user.telegram_id}@telegram.com"
        user.telegram_email = user.email

    if not user.role_id:
        user.role_id = 1 # Default role

    user.last_login = timezone.now()
    
    user.save() # Save the updated user fields.

    logger.info(f"Telegram user processed and saved: user_id={user.user_id}, telegram_id={user.telegram_id}")

    # Связываем sociallogin с пользователем
    # sociallogin.connect(request, user) # This line is not needed and incorrect here. Allauth handles it.