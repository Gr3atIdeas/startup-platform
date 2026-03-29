"""Helpers for pinned catalog items and ad placements."""
import logging

from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


def get_pinned_entities(entity_type, model_class, pk_field):
    """Return ordered list of pinned entity objects for a catalog type."""
    try:
        from accounts.models import PinnedCatalogItem

        pins = list(
            PinnedCatalogItem.objects.filter(
                entity_type=entity_type, is_active=True
            ).order_by("position").values_list("entity_id", flat=True)
        )
        if not pins:
            return []

        entities = model_class.objects.filter(
            **{f"{pk_field}__in": pins, "status": "approved"}
        )
        entity_map = {getattr(e, pk_field): e for e in entities}
        return [entity_map[eid] for eid in pins if eid in entity_map]
    except Exception:
        logger.debug("pinned_catalog_items table not ready, skipping")
        return []


def get_active_ads(location):
    """Return list of ad dicts for a given location."""
    try:
        from accounts.models import AdPlacement

        today = timezone.now().date()
        placements = (
            AdPlacement.objects.filter(location=location, is_active=True)
            .filter(models.Q(start_date__isnull=True) | models.Q(start_date__lte=today))
            .filter(models.Q(end_date__isnull=True) | models.Q(end_date__gte=today))
            .order_by("sort_order")
        )
    except Exception:
        logger.debug("ad_placements table not ready, skipping")
        return []

    ads = []
    for p in placements:
        entity = p.get_entity()
        if not entity or getattr(entity, "status", "") != "approved":
            continue

        # Build URL
        url = ""
        slug = getattr(entity, "slug", "") or ""
        if p.entity_type == "startup":
            url = f"/startup/{slug or entity.startup_id}/"
        elif p.entity_type == "franchise":
            url = f"/franchise/{slug or entity.franchise_id}/"
        elif p.entity_type == "agency":
            url = f"/agency/{slug or entity.agency_id}/"
        elif p.entity_type == "specialist":
            url = f"/specialist/{slug or entity.specialist_id}/"

        ads.append({
            "placement": p,
            "entity": entity,
            "entity_type": p.entity_type,
            "title": p.title or entity.title,
            "description": (p.description or getattr(entity, "short_description", "") or "")[:200],
            "url": url,
        })
    return ads
