from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.urls import reverse
import logging
from django.core.exceptions import MultipleObjectsReturned

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
        """
        try:
            app = super().get_app(request, provider=provider)
            logger.debug(f"Retrieved SocialApp: id={app.id}, provider={app.provider}, sites={list(app.sites.all())}")
            return app
        except MultipleObjectsReturned:
            logger.error(f"Multiple SocialApp objects found for provider '{provider}'")
            apps = self.get_app_queryset(request, provider=provider)
            logger.debug(f"Found apps: {[f'id={app.id}, provider={app.provider}, sites={list(app.sites.all())}' for app in apps]}")
            app = apps.first()
            if not app:
                logger.error(f"No SocialApp found for provider '{provider}' after filtering.")
                raise
            logger.warning(f"Selected first SocialApp: id={app.id}, provider={app.provider}, sites={list(app.sites.all())}")
            return app