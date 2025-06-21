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
        user = super().populate_user(request, sociallogin, data)
        if sociallogin.account.provider == 'telegram':
            # Данные из Telegram
            telegram_id = sociallogin.account.extra_data.get('id')
            username = data.get('username')
            first_name = data.get('first_name')
            last_name = data.get('last_name')

            # Устанавливаем telegram_id
            if telegram_id:
                user.telegram_id = str(telegram_id)

            # Если username от Telegram пустой, генерируем свой
            if not username:
                username = f"telegram_user_{telegram_id}"
            user.username = username

            # Устанавливаем имя и фамилию
            user.first_name = first_name
            user.last_name = last_name

            # Если email не получен, создаем временный уникальный email
            if not user_email(user):
                user.email = f"{user.username}@telegram.placeholder.com"

        return user

    def save_user(self, request, sociallogin, form=None):
        """
        Сохраняет пользователя и назначает ему роль 'Временный' (id=4),
        если он регистрируется через Telegram и у него еще нет роли.
        """
        # Сначала создаем пользователя стандартным способом
        user = super().save_user(request, sociallogin, form)

        # Если регистрация через Telegram и роль еще не назначена
        if sociallogin.account.provider == 'telegram' and not user.role_id:
            try:
                # Назначаем временную роль.
                # Предполагается, что роль с ID=4 существует в таблице Roles
                # и соответствует временному статусу пользователя.
                temp_role = Roles.objects.get(pk=4)
                user.role = temp_role
                user.save(update_fields=['role'])
                logger.info(f"Назначена временная роль (ID=4) для нового пользователя Telegram: {user.username}")
            except Roles.DoesNotExist:
                logger.error("Роль с ID=4 не найдена в базе данных. Не удалось назначить временную роль.")

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