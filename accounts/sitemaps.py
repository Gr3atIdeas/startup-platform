from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import (
    Startups, Franchises, Agencies, Specialists, NewsArticles,
    City, Directions, FranchiseLocation,
)


class StaticViewSitemap(Sitemap):
    protocol = "https"
    priority = 0.8
    changefreq = "daily"

    def items(self):
        return [
            "home",
            "startups_list",
            "franchises_list",
            "agencies_list",
            "specialists_list",
            "news",
        ]

    def location(self, item):
        return reverse(item)


class StartupSitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Startups.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("startup_detail", kwargs={"slug": obj.slug})


class FranchiseSitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Franchises.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("franchise_detail", kwargs={"slug": obj.slug})


class AgencySitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Agencies.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("agency_detail", kwargs={"slug": obj.slug})


class SpecialistSitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Specialists.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("specialist_detail", kwargs={"slug": obj.slug})


class FranchiseCitySitemap(Sitemap):
    """Городские лендинги франшиз — /franchises/city/{slug}/."""
    protocol = "https"
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        city_ids = (
            FranchiseLocation.objects
            .filter(franchise__status="approved", status="active")
            .values_list("city_id", flat=True)
            .distinct()
        )
        return City.objects.filter(city_id__in=city_ids).order_by("name")

    def location(self, obj):
        return reverse("franchises_by_city", kwargs={"city_slug": obj.slug})


class FranchiseDirectionSitemap(Sitemap):
    """Категорийные лендинги франшиз — /franchises/direction/{slug}/."""
    protocol = "https"
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        direction_ids = (
            Franchises.objects
            .filter(status="approved")
            .values_list("direction_id", flat=True)
            .distinct()
        )
        return Directions.objects.filter(direction_id__in=direction_ids).order_by("direction_name")

    def location(self, obj):
        from .views import get_direction_slug
        slug = get_direction_slug(obj)
        return reverse("franchises_by_direction", kwargs={"direction_slug": slug})


class FranchiseInvestmentSitemap(Sitemap):
    """Инвестиционные лендинги франшиз — /franchises/investicii/{slug}/."""
    protocol = "https"
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        from .views import INVESTMENT_RANGE_SLUGS
        return INVESTMENT_RANGE_SLUGS

    def location(self, item):
        from .views import get_investment_url
        return get_investment_url(item)


class NewsSitemap(Sitemap):
    protocol = "https"
    changefreq = "daily"
    priority = 0.8

    def items(self):
        return NewsArticles.objects.filter(status="published").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("news_detail", kwargs={"slug": obj.slug})
