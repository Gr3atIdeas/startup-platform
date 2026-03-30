"""
Management command to queue Telegram notifications for approved entities
that were never notified (e.g. approved before the notification system existed,
or approved via direct save without triggering approve_entity()).

Usage:
    python manage.py resend_entity_notifications          # dry-run by default
    python manage.py resend_entity_notifications --send   # actually queue tasks
"""
import logging
from django.core.management.base import BaseCommand
from django.db import connection

logger = logging.getLogger(__name__)

ENTITY_MODELS = {
    "startup": ("Startups", "startup_id"),
    "franchise": ("Franchises", "franchise_id"),
    "agency": ("Agencies", "agency_id"),
    "specialist": ("Specialists", "specialist_id"),
}


class Command(BaseCommand):
    help = "Queue Telegram notifications for approved entities missing from news_entity_notifications"

    def add_arguments(self, parser):
        parser.add_argument(
            "--send",
            action="store_true",
            help="Actually send notifications (default is dry-run)",
        )

    def handle(self, *args, **options):
        send = options["send"]
        from accounts.models import Startups, Franchises, Agencies, Specialists

        model_map = {
            "startup": Startups,
            "franchise": Franchises,
            "agency": Agencies,
            "specialist": Specialists,
        }

        total_missing = 0
        total_queued = 0

        for entity_type, model in model_map.items():
            _, pk_field = ENTITY_MODELS[entity_type]
            approved = model.objects.filter(status="approved")

            for entity in approved:
                entity_id = getattr(entity, pk_field)

                with connection.cursor() as cur:
                    cur.execute(
                        "SELECT 1 FROM news_entity_notifications "
                        "WHERE entity_type = %s AND entity_id = %s",
                        (entity_type, entity_id),
                    )
                    if cur.fetchone():
                        continue

                total_missing += 1
                title = getattr(entity, "title", "")[:60]
                self.stdout.write(
                    f"  MISSING: {entity_type} #{entity_id} — {title}"
                )

                if send:
                    try:
                        from accounts.tasks import notify_entity_approved
                        notify_entity_approved.delay(entity_type, entity_id)
                        total_queued += 1
                    except Exception as e:
                        self.stderr.write(f"  ERROR queuing {entity_type} #{entity_id}: {e}")

        self.stdout.write("")
        if send:
            self.stdout.write(
                self.style.SUCCESS(f"Done: {total_queued}/{total_missing} notifications queued")
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"DRY RUN: {total_missing} entities missing notifications. "
                    f"Run with --send to actually queue them."
                )
            )
