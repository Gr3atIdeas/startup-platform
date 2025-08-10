import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Franchises, Agencies


class Command(BaseCommand):
    help = "Create Agencies records from existing Franchises (one-time migration)"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None, help="Limit number of migrated records")
        parser.add_argument("--dry-run", action="store_true", help="Do not save, only print plan")

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        limit = options.get("limit")

        qs = Franchises.objects.all().order_by("-created_at")
        if limit:
            qs = qs[:limit]

        random.seed()
        agency_categories = [
            "Веб-разработка",
            "Мобильная разработка",
            "Дизайн",
            "Маркетинг",
            "ИИ",
            "Брендинг",
            "Видео и мультимедиа",
        ]

        migrated = 0
        skipped = 0

        with transaction.atomic():
            for fr in qs:
                # Пропустим, если уже существует запись с таким же title у того же owner
                title_src = fr.customization_data.get("agency_display_title") if isinstance(fr.customization_data, dict) else None
                title = (title_src or fr.title or "").strip() or f"Agency {fr.franchise_id}"

                exists = Agencies.objects.filter(title=title, owner=fr.owner).exists()
                if exists:
                    skipped += 1
                    continue

                data = fr.customization_data if isinstance(fr.customization_data, dict) else {}
                if not data.get("agency_display_title"):
                    data["agency_display_title"] = title
                if not data.get("agency_category"):
                    data["agency_category"] = random.choice(agency_categories)

                ag = Agencies(
                    agency_id=fr.franchise_id,
                    owner=fr.owner,
                    title=title,
                    short_description=fr.short_description,
                    description=fr.description,
                    terms=fr.terms,
                    direction=fr.direction,
                    stage=fr.stage,
                    pitch_deck_url=fr.pitch_deck_url,
                    created_at=fr.created_at or timezone.now(),
                    updated_at=fr.updated_at or timezone.now(),
                    status=fr.status,
                    customization_data=data,
                    total_voters=fr.total_voters,
                    sum_votes=fr.sum_votes,
                    logo_urls=fr.logo_urls or [],
                    creatives_urls=fr.creatives_urls or [],
                    proofs_urls=fr.proofs_urls or [],
                    video_urls=fr.video_urls or [],
                    planet_image=fr.planet_image,
                )
                if not dry_run:
                    try:
                        ag.save()
                    except Exception:
                        skipped += 1
                        continue
                migrated += 1

        self.stdout.write(self.style.SUCCESS(f"Migrated: {migrated}, skipped: {skipped}"))


