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
        """
        Override to handle cases where multiple SocialApp objects exist for the same provider.
        Ensures only one SocialApp is returned, filtered by provider and SITE_ID.
        """
        logger.debug(f"Attempting to get SocialApp for provider '{provider}' with SITE_ID={settings.SITE_ID}")
        try:
            app = super().get_app(request, provider=provider)
            logger.debug(f"Retrieved SocialApp: id={app.id}, provider={app.provider}, name={app.name}, sites={list(app.sites.values('id', 'domain'))}")
            return app
        except MultipleObjectsReturned:
            logger.error(f"Multiple SocialApp objects found for provider '{provider}'")
            # Manually query SocialApp with explicit SITE_ID filter
            current_site = Site.objects.get(id=settings.SITE_ID)
            apps = SocialApp.objects.filter(provider=provider, sites=current_site)
            logger.debug(f"Found apps for provider '{provider}' and site '{current_site.domain}': "
                        f"{[f'id={app.id}, provider={app.provider}, name={app.name}, sites={list(app.sites.values('id', 'domain'))}' for app in apps]}")
            
            if not apps.exists():
                logger.error(f"No SocialApp found for provider '{provider}' and site '{current_site.domain}'")
                raise ValueError(f"No SocialApp configured for provider '{provider}' and site '{current_site.domain}'")
            
            if apps.count() > 1:
                logger.warning(f"Multiple SocialApps still found after filtering by site. Selecting first one.")
            
            app = apps.first()
            logger.info(f"Selected SocialApp: id={app.id}, provider={app.provider}, name={app.name}, sites={list(app.sites.values('id', 'domain'))}")
            return app