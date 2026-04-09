import os
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path

from accounts.sitemaps import (
    AgencySitemap,
    FranchiseCitySitemap,
    FranchiseDirectionSitemap,
    FranchiseInvestmentSitemap,
    FranchiseSitemap,
    NewsSitemap,
    SpecialistSitemap,
    StartupSitemap,
    StaticViewSitemap,
)

sitemaps = {
    "static": StaticViewSitemap,
    "startups": StartupSitemap,
    "franchises": FranchiseSitemap,
    "franchise_cities": FranchiseCitySitemap,
    "franchise_directions": FranchiseDirectionSitemap,
    "franchise_investments": FranchiseInvestmentSitemap,
    "agencies": AgencySitemap,
    "specialists": SpecialistSitemap,
    "news": NewsSitemap,
}

urlpatterns = [
    path('accounts/', include('allauth.urls')),
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="django.contrib.sitemaps.views.sitemap"),
    path("", include("accounts.urls")),
    path('admin/', admin.site.urls),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if os.getenv("ENABLE_SILK", "False") == "True":
    urlpatterns.append(path('silk/', include('silk.urls', namespace='silk')))
handler404 = "accounts.views.custom_404"
