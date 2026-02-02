"""
Централизованная логика модерации.
Используется из Django Admin actions и из views.py.
"""
import logging

from django.utils import timezone

logger = logging.getLogger(__name__)


def _log_moderation_action(moderator, action, entity_type, entity_id, entity_title="", comment=""):
    """Записывает действие модератора в ModerationLog."""
    from accounts.models import ModerationLog

    try:
        ModerationLog.objects.create(
            moderator=moderator,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_title=str(entity_title)[:255],
            comment=str(comment)[:2000] if comment else "",
        )
    except Exception as e:
        logger.error("Ошибка записи ModerationLog: %s", e)


def _invalidate_cache():
    """Сбрасывает кэш каталогов и главной страницы."""
    from django.core.cache import cache as django_cache

    django_cache.delete("home_page_anonymous_v1")
    try:
        django_cache.delete_pattern("*views.decorators.cache*")
    except (AttributeError, NotImplementedError):
        django_cache.clear()


def approve_entity(entity, moderator, entity_type, moderator_comment=""):
    """
    Одобряет объект (стартап, франшизу, агентство, специалиста).

    Args:
        entity: экземпляр модели (Startups, Franchises, Agencies, Specialists)
        moderator: пользователь-модератор (Users)
        entity_type: тип сущности ("startup", "franchise", "agency", "specialist")
        moderator_comment: комментарий модератора
    """
    from accounts.models import ReviewStatuses

    entity.moderator_comment = moderator_comment
    entity.status = "approved"

    # Устанавливаем status_id для моделей, которые его поддерживают
    if hasattr(entity, "status_id"):
        try:
            entity.status_id = ReviewStatuses.objects.get(status_name="Approved")
        except ReviewStatuses.DoesNotExist:
            logger.warning("ReviewStatuses 'Approved' не найден в БД")

    entity.save()
    _invalidate_cache()

    # Определяем ID и title для лога
    pk_field = {
        "startup": "startup_id",
        "franchise": "franchise_id",
        "agency": "agency_id",
        "specialist": "specialist_id",
    }.get(entity_type, "pk")
    entity_id = getattr(entity, pk_field, entity.pk)

    _log_moderation_action(
        moderator=moderator,
        action="approve",
        entity_type=entity_type,
        entity_id=entity_id,
        entity_title=getattr(entity, "title", ""),
        comment=moderator_comment,
    )

    return True


def reject_entity(entity, moderator, entity_type, moderator_comment=""):
    """
    Отклоняет объект (стартап, франшизу, агентство, специалиста).
    """
    from accounts.models import ReviewStatuses

    entity.moderator_comment = moderator_comment
    entity.status = "rejected"

    if hasattr(entity, "status_id"):
        try:
            entity.status_id = ReviewStatuses.objects.get(status_name="Rejected")
        except ReviewStatuses.DoesNotExist:
            logger.warning("ReviewStatuses 'Rejected' не найден в БД")

    entity.save()
    _invalidate_cache()

    pk_field = {
        "startup": "startup_id",
        "franchise": "franchise_id",
        "agency": "agency_id",
        "specialist": "specialist_id",
    }.get(entity_type, "pk")
    entity_id = getattr(entity, pk_field, entity.pk)

    _log_moderation_action(
        moderator=moderator,
        action="reject",
        entity_type=entity_type,
        entity_id=entity_id,
        entity_title=getattr(entity, "title", ""),
        comment=moderator_comment,
    )

    return True
