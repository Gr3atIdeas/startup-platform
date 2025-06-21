from allauth.socialaccount.signals import pre_social_login
from django.dispatch import receiver
from .utils import update_user_from_telegram
import logging

logger = logging.getLogger(__name__)

@receiver(pre_social_login)
def handle_telegram_login_update(request, sociallogin, **kwargs):
    """
    This receiver is called on every social login.
    It calls a utility function to update user's profile with the latest data from Telegram.
    """
    if sociallogin and sociallogin.user.pk:
        logger.info(f"Signal pre_social_login caught for user {sociallogin.user.pk}. Triggering update.")
        update_user_from_telegram(sociallogin.user, sociallogin)