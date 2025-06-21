from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.urls import reverse
import logging

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