from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import Startups, Franchises, Agencies, Specialists, NewsArticles


class StaticViewSitemap(Sitemap):
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
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Startups.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("startup_detail", kwargs={"slug": obj.slug})


class FranchiseSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Franchises.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("franchise_detail", kwargs={"slug": obj.slug})


class AgencySitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Agencies.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("agency_detail", kwargs={"slug": obj.slug})


class SpecialistSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Specialists.objects.filter(status="approved").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("specialist_detail", kwargs={"slug": obj.slug})


class NewsSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.6

    def items(self):
        return NewsArticles.objects.filter(status="published").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("news_detail", kwargs={"slug": obj.slug})
