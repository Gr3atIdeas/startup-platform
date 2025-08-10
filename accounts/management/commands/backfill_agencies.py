import random
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import Franchises


class Command(BaseCommand):
    help = "Backfill agency_display_title and agency_category for all franchises used as agencies"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do not save changes, only show what would be updated",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        random.seed()

        adjectives = [
            "Orbit",
            "Nova",
            "Comet",
            "Pixel",
            "Neuro",
            "Skyline",
            "Quantum",
            "Astro",
            "Deep",
            "Hyper",
            "Blue",
            "Meta",
            "Brand",
            "Code",
            "Vision",
            "Echo",
            "Craft",
            "Motion",
            "Prime",
            "Fusion",
            "Rocket",
            "Bright",
            "Next",
            "Alpha",
            "Beta",
            "Gamma",
            "Delta",
            "Nimbus",
        ]
        nouns = [
            "Digital",
            "Lab",
            "Studio",
            "Works",
            "Foundry",
            "Media",
            "Brand",
            "Forge",
            "Garden",
            "Pixel",
            "Quark",
            "Wave",
            "Link",
            "Smiths",
            "UX",
            "Vision",
            "Craft",
            "Factory",
            "Agency",
            "Minds",
            "Core",
        ]
        agency_categories = [
            "Веб-разработка",
            "Мобильная разработка",
            "Дизайн",
            "Маркетинг",
            "ИИ",
            "Брендинг",
            "Видео и мультимедиа",
        ]

        def generate_name():
            return f"{random.choice(adjectives)} {random.choice(nouns)}"

        # Соберем уже занятые названия среди всех записей (из display_title либо title)
        existing = set()
        qs_all = Franchises.objects.all().only("title", "customization_data")
        for fr in qs_all:
            data = fr.customization_data or {}
            base = None
            if isinstance(data, dict):
                base = (data.get("agency_display_title") or fr.title or "").strip().lower()
            else:
                base = (fr.title or "").strip().lower()
            if base:
                existing.add(base)

        updated = 0
        with transaction.atomic():
            for fr in Franchises.objects.all().only("customization_data", "title"):
                data = fr.customization_data or {}
                if not isinstance(data, dict):
                    data = {}
                name = (data.get("agency_display_title") or fr.title or "").strip()
                if not name or name.lower() in existing:
                    # подобрать уникальное
                    for _ in range(500):
                        candidate = generate_name()
                        if candidate.lower() not in existing:
                            name = candidate
                            existing.add(candidate.lower())
                            break
                if not data.get("agency_category"):
                    data["agency_category"] = random.choice(agency_categories)
                data["agency_display_title"] = name
                fr.customization_data = data
                if not dry_run:
                    fr.save(update_fields=["customization_data"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {updated} records"))


