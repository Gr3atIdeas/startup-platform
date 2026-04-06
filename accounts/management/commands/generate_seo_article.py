"""
Generate one SEO article about franchises using real data + Grok AI.

Usage:
    python manage.py generate_seo_article              # auto-select topic
    python manage.py generate_seo_article --type top_category
    python manage.py generate_seo_article --type franchise_deep_dive
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Generate one SEO article draft using franchise data + Grok AI"

    def add_arguments(self, parser):
        parser.add_argument(
            "--type",
            type=str,
            default="",
            help="Force specific article type: top_category, city_review, franchise_deep_dive, cost_overview, budget_filter",
        )

    def handle(self, *args, **options):
        from accounts.seo_generator import SEOArticleGenerator, GENERATORS

        forced_type = options.get("type", "").strip()

        if forced_type:
            if forced_type not in GENERATORS:
                self.stderr.write(f"Unknown type: {forced_type}. Available: {', '.join(GENERATORS.keys())}")
                return
            self.stdout.write(f"Generating forced type: {forced_type}")
            generator_fn = GENERATORS[forced_type]
            article = generator_fn()
        else:
            self.stdout.write("Auto-selecting topic type...")
            gen = SEOArticleGenerator()
            article = gen.generate()

        if article:
            self.stdout.write(self.style.SUCCESS(
                f"Article created: '{article.title}' (id={article.article_id}, status=draft)\n"
                f"Review in admin: /admin/accounts/newsarticles/{article.article_id}/change/"
            ))
        else:
            self.stdout.write(self.style.WARNING("No article generated — check logs for details"))
