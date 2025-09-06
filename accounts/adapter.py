from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.urls import reverse
import logging
from django.core.exceptions import MultipleObjectsReturned
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from allauth.account.utils import user_email
from .models import Roles, Users
from .utils import update_user_from_telegram
logger = logging.getLogger(__name__)
class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        """
        Populates user fields from social account data for NEW users only.
        Updates for existing users are handled by the pre_social_login signal.
        """
        user = super().populate_user(request, sociallogin, data)
        if sociallogin.account.provider == 'telegram' and not user.pk:
            telegram_data = sociallogin.account.extra_data
            user.telegram_id = str(telegram_data.get('id'))
            user.username = telegram_data.get('username')
            user.first_name = telegram_data.get('first_name')
            user.last_name = telegram_data.get('last_name', '')
            user.profile_picture_url = telegram_data.get('photo_url')
            if user.username:
                user.social_links = {'telegram': f"https://t.me/{user.username}"}
            if not user.username and user.telegram_id:
                user.username = f"telegram_user_{user.telegram_id}"
            if not user_email(user) and user.username:
                user.email = f"{user.username}@telegram.placeholder.com"
        return user
    def save_user(self, request, sociallogin, form=None):
        """
        Saves the user and then triggers an update from Telegram data
        as a fallback mechanism.
        """
        user = super().save_user(request, sociallogin, form)
        if sociallogin.account.provider == 'telegram':
            if not user.role_id:
                try:
                    temp_role = Roles.objects.get(pk=4)
                    user.role = temp_role
                    user.save(update_fields=['role'])
                    logger.info(f"Assigned temporary role (ID=4) to new Telegram user: {user.username}")
                except Roles.DoesNotExist:
                    logger.error("Role with ID=4 not found. Could not assign temporary role.")
            logger.info(f"save_user method is triggering a data update for user {user.pk}.")
            update_user_from_telegram(user, sociallogin)
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
    def get_app(self, request, provider, client_id=None, **kwargs):
        logger.debug(
            f"Attempting to get SocialApp for provider '{provider}' with SITE_ID={settings.SITE_ID}"
            + (f", client_id={client_id}" if client_id else "")
        )
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
            # Ensure secret (bot token) is set from settings, if available
            try:
                token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
                if token and (not app.secret or app.secret != token):
                    app.secret = token
                    app.save(update_fields=['secret'])
                    logger.info("Updated Telegram SocialApp.secret from settings token")
            except Exception:
                logger.warning("Could not ensure Telegram SocialApp.secret from settings", exc_info=True)
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
