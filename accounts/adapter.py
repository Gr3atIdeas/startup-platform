from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.urls import reverse
import logging
from django.core.exceptions import MultipleObjectsReturned
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from allauth.account.utils import user_email
from .models import Roles, Users

logger = logging.getLogger(__name__)

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        """
        Populates and updates user fields from social account data on every login.
        """
        user = super().populate_user(request, sociallogin, data)

        if sociallogin.account.provider == 'telegram':
            telegram_data = sociallogin.account.extra_data
            is_new_user = not user.pk

            # --- Data from Telegram ---
            tg_id = str(telegram_data.get('id'))
            tg_username = telegram_data.get('username')
            tg_first_name = telegram_data.get('first_name')
            tg_last_name = telegram_data.get('last_name', '')
            tg_photo_url = telegram_data.get('photo_url')

            # --- Always update user data from Telegram ---
            user.telegram_id = tg_id
            if tg_username:
                user.username = tg_username
            if tg_first_name:
                user.first_name = tg_first_name
            # We can update last_name even if it's empty string
            user.last_name = tg_last_name
            if tg_photo_url:
                user.profile_picture_url = tg_photo_url
            
            # --- Update social_links (JSONB field) ---
            if tg_username:
                telegram_link = f"https://t.me/{tg_username}"
                if not isinstance(user.social_links, dict):
                    user.social_links = {}
                user.social_links['telegram'] = telegram_link

            # --- Handle specifics for brand new users ---
            if is_new_user:
                if not user.username and tg_id:
                    user.username = f"telegram_user_{tg_id}"
                
                if not user_email(user) and user.username:
                    user.email = f"{user.username}@telegram.placeholder.com"
        
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

    def get_connect_redirect_url(self, request, socialaccount):
        url = super().get_connect_redirect_url(request, socialaccount)
        if not settings.DEBUG and '://greatideas.ru' in url:
            url = url.replace('://greatideas.ru', '://www.greatideas.ru')
        logger.debug(f"Generated redirect_uri: {url}")
        return url

    def get_login_redirect_url(self, request):
        logger.debug("Redirecting after login to /profile/")
        return reverse("profile")

    def get_app(self, request, provider):
        logger.debug(f"Attempting to get SocialApp for provider '{provider}' with SITE_ID={settings.SITE_ID}")
        try:
            current_site = Site.objects.get(id=settings.SITE_ID)
            apps = SocialApp.objects.filter(provider=provider, sites=current_site)
            app_info = [
                f"id={app.id}, provider={app.provider}, name={app.name}, sites={list(app.sites.values('id', 'domain'))}"
                for app in apps
            ]
            logger.debug(f"Found apps: {app_info}")
            
            if not apps.exists():
                logger.error(f"No SocialApp found for provider '{provider}' and site '{current_site.domain}'")
                raise ValueError(f"No SocialApp configured for provider '{provider}' and site '{current_site.domain}'")
            
            if apps.count() > 1:
                logger.warning(f"Multiple SocialApps found: {[app.id for app in apps]}")
            
            app = apps.first()
            logger.info(f"Selected SocialApp: id={app.id}, provider={app.provider}, name={app.name}, sites={list(app.sites.values('id', 'domain'))}")
            return app
        except MultipleObjectsReturned:
            logger.error(f"MultipleObjectsReturned caught for provider '{provider}'")
            apps = SocialApp.objects.filter(provider=provider, sites=current_site)
            app = apps.first()
            if not app:
                logger.error(f"No valid SocialApp found after fallback filtering")
                raise
            logger.info(f"Fallback selected SocialApp: id={app.id}, provider={app.provider}, name={app.name}, sites={list(app.sites.values('id', 'domain'))}")
            return app