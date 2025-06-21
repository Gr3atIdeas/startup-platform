from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.urls import reverse
import logging
from .models import Roles, Users

logger = logging.getLogger(__name__)

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        """
        Populates user fields from social account data.
        This method is called on every login.
        """
        user = super().populate_user(request, sociallogin, data)

        if sociallogin.account.provider == 'telegram':
            telegram_data = sociallogin.account.extra_data
            is_new_user = not user.pk

            # These fields are updated on every login from Telegram.
            username = telegram_data.get('username')
            photo_url = telegram_data.get('photo_url')

            if username:
                user.username = username
                if user.social_links is None:
                    user.social_links = {}
                user.social_links['telegram'] = f"https://t.me/{username}"

            if photo_url:
                user.profile_picture_url = photo_url

            # These fields are set only when the user is first created.
            if is_new_user:
                user.first_name = telegram_data.get('first_name')
                user.last_name = telegram_data.get('last_name')

                telegram_id = telegram_data.get('id')
                if telegram_id:
                    user.telegram_id = str(telegram_id)

                # A username is required. If Telegram doesn't provide one,
                # create a default one.
                if not user.username:
                    user.username = f"telegram_user_{telegram_id or user.pk}"
        
        return user

    def save_user(self, request, sociallogin, form=None):
        """
        Saves the user and assigns a temporary role if they are new
        and registering via Telegram.
        """
        user = super().save_user(request, sociallogin, form)

        if sociallogin.account.provider == 'telegram' and not user.role_id:
            try:
                temp_role = Roles.objects.get(pk=4)
                user.role = temp_role
                user.save(update_fields=['role'])
                logger.info(f"Assigned temporary role (ID=4) to new Telegram user: {user.username}")
            except Roles.DoesNotExist:
                logger.error("Role with ID=4 not found. Could not assign temporary role.")

        return user

    def get_login_redirect_url(self, request):
        logger.debug("Redirecting after login to /profile/")
        return reverse("profile")