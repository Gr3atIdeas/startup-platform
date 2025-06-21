from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.urls import reverse
import logging
from django.core.exceptions import MultipleObjectsReturned
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site

logger = logging.getLogger(__name__)

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_connect_redirect_url(self, request, socialaccount):
        url = super().get_connect_redirect_url(request, socialaccount)
        if not settings.DEBUG and '://greatideas.ru' in url:
            url = url.replace('://greatideas.ru', '://www.greatideas.ru')
        logger.debug(f"Generated redirect_uri: {url}")
        return url

    def get_login_redirect_url(self, request):
        logger.debug("Redirecting after login to startups_list")
        return reverse('startups_list')

    def get_app(self, request, provider):
        logger.debug(f"Attempting to get SocialApp for provider '{provider}' with SITE_ID={settings.SITE_ID}")
        try:
            current_site = Site.objects.get(id=settings.SITE_ID)
            apps = SocialApp.objects.filter(provider=provider, sites=current_site)
            logger.debug(f"Found apps: {[f'id={app.id}, provider={app.provider}, name={app.name}, sites={list(app.sites.values('id', 'domain'))}' for app in apps]}")
            
            if not apps.exists():
                logger.error(f"No SocialApp found for provider '{provider}' and site '{current_site.domain}'")
                raise ValueError(f"No SocialApp configured for provider '{provider}' and site '{current_site.domain}'")
            
            if apps.count() > 1:
                logger.warning(f"Multiple SocialApps found: {[f'id={app.id}' for app in apps]}")
            
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