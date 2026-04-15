"""
Management command to publish the next prepared article from content/articles/.

Usage:
    python manage.py publish_article             # publish next article
    python manage.py publish_article --dry-run    # preview without saving
    python manage.py publish_article --file X.json  # publish specific file
"""

import json
import os
import re
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone

ARTICLES_DIR = Path(__file__).resolve().parents[3] / "content" / "articles"
PUBLISHED_LOG = ARTICLES_DIR / ".published"


def _get_published():
    """Return set of already-published filenames."""
    if not PUBLISHED_LOG.exists():
        return set()
    return set(PUBLISHED_LOG.read_text(encoding="utf-8").strip().splitlines())


def _mark_published(filename):
    """Append filename to the published log."""
    with open(PUBLISHED_LOG, "a", encoding="utf-8") as f:
        f.write(filename + "\n")


def _next_article(specific_file=None):
    """Find the next article file to publish.

    Files are sorted by name (use numeric prefix for ordering).
    Files starting with _ are skipped (templates/examples).
    """
    published = _get_published()

    if specific_file:
        path = ARTICLES_DIR / specific_file
        if not path.exists():
            return None, f"File not found: {specific_file}"
        if specific_file in published:
            return None, f"Already published: {specific_file}"
        return path, None

    files = sorted(
        f for f in os.listdir(ARTICLES_DIR)
        if f.endswith(".json")
        and not f.startswith("_")
        and f not in published
    )

    if not files:
        return None, "No unpublished articles found."

    return ARTICLES_DIR / files[0], None


class Command(BaseCommand):
    help = "Publish the next prepared SEO article from content/articles/"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview article without saving to database",
        )
        parser.add_argument(
            "--file",
            type=str,
            default=None,
            help="Publish a specific file by name (e.g. 001_slug.json)",
        )

    def handle(self, *args, **options):
        from accounts.models import NewsArticles, NewsCategories

        path, error = _next_article(options["file"])
        if error:
            self.stderr.write(self.style.ERROR(error))
            return

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        title = data.get("title", "")[:255]
        content = data.get("content", "")
        tags = data.get("tags", "")[:255]
        category_slug = data.get("category_slug", "")
        content_type = data.get("content_type", "article")
        entity_focus = data.get("entity_focus", "franchise")
        image_url = data.get("image_url", "") or None

        if not title or not content:
            self.stderr.write(self.style.ERROR(f"Empty title or content in {path.name}"))
            return

        # Resolve category
        category = None
        if category_slug:
            category = NewsCategories.objects.filter(slug=category_slug).first()

        filename = path.name

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("--- DRY RUN ---"))
            self.stdout.write(f"File:     {filename}")
            self.stdout.write(f"Title:    {title}")
            self.stdout.write(f"Category: {category or category_slug}")
            self.stdout.write(f"Tags:     {tags}")
            self.stdout.write(f"Focus:    {entity_focus}")
            self.stdout.write(f"Content:  {len(content)} chars")
            return

        now = timezone.now()
        article = NewsArticles(
            title=title,
            content=content,
            tags=tags,
            status="published",
            content_type=content_type,
            entity_focus=entity_focus,
            category=category,
            image_url=image_url,
            published_at=now,
            updated_at=now,
        )
        article.save()

        _mark_published(filename)

        self.stdout.write(self.style.SUCCESS(
            f"Published: \"{title}\" (id={article.article_id}, slug={article.slug})"
        ))
