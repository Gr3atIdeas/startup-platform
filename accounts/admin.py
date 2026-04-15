import json
import logging
import os
import re
import uuid
from pathlib import Path

import boto3
from botocore.config import Config as BotoConfig
from django.conf import settings
from django.contrib import admin
from django.contrib.admin.options import ModelAdmin
from django.http import JsonResponse
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone
from django.utils.html import format_html

logger = logging.getLogger(__name__)


# Fix: django_admin_log FK points at auth_user, but we use custom Users table.
# Patch ModelAdmin to skip all log writes so no rows touch django_admin_log.
ModelAdmin.log_addition = lambda self, *a, **kw: None
ModelAdmin.log_change = lambda self, *a, **kw: None
ModelAdmin.log_deletion = lambda self, *a, **kw: None

from .models import (
    Startups,
    Franchises,
    Agencies,
    Specialists,
    Users,
    Comments,
    FranchiseComments,
    AgencyComments,
    SpecialistComments,
    ModerationLog,
    Directions,
    ReviewStatuses,
    NewsArticles,
    NewsCategories,
    NewsComments,
    PinnedCatalogItem,
    AdPlacement,
    Lead,
    City,
    FranchiseLocation,
    ArticleTopicLog,
)
from .moderation import approve_entity, reject_entity


# ── Inline модели ──────────────────────────────────────────────────

class CommentsInline(admin.TabularInline):
    model = Comments
    fk_name = "startup_id"
    extra = 0
    readonly_fields = ("comment_id", "user_id", "content", "user_rating", "created_at")
    fields = ("user_id", "content", "user_rating", "created_at")
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return False


class FranchiseCommentsInline(admin.TabularInline):
    model = FranchiseComments
    extra = 0
    readonly_fields = ("comment_id", "user", "content", "user_rating", "created_at")
    fields = ("user", "content", "user_rating", "created_at")
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return False


class AgencyCommentsInline(admin.TabularInline):
    model = AgencyComments
    extra = 0
    readonly_fields = ("comment_id", "user", "content", "user_rating", "created_at")
    fields = ("user", "content", "user_rating", "created_at")
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return False


class SpecialistCommentsInline(admin.TabularInline):
    model = SpecialistComments
    extra = 0
    readonly_fields = ("comment_id", "user", "content", "user_rating", "created_at")
    fields = ("user", "content", "user_rating", "created_at")
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return False


# ── Общие admin actions ────────────────────────────────────────────

def _make_approve_action(entity_type):
    """Фабрика action-функций для одобрения сущностей."""
    def action(modeladmin, request, queryset):
        count = 0
        for obj in queryset.filter(status="pending"):
            approve_entity(obj, request.user, entity_type, moderator_comment="Одобрено через Django Admin")
            count += 1
        modeladmin.message_user(request, f"Одобрено: {count}")
    action.short_description = "Одобрить выбранные"
    action.__name__ = f"approve_{entity_type}"
    return action


def _make_reject_action(entity_type):
    """Фабрика action-функций для отклонения сущностей."""
    def action(modeladmin, request, queryset):
        count = 0
        for obj in queryset.exclude(status="rejected"):
            reject_entity(obj, request.user, entity_type, moderator_comment="Отклонено через Django Admin")
            count += 1
        modeladmin.message_user(request, f"Отклонено: {count}")
    action.short_description = "Отклонить выбранные"
    action.__name__ = f"reject_{entity_type}"
    return action


def _make_set_pending_action(entity_type):
    """Фабрика action-функций для возврата на модерацию."""
    def action(modeladmin, request, queryset):
        count = queryset.exclude(status="pending").update(status="pending")
        modeladmin.message_user(request, f"Возвращено на модерацию: {count}")
    action.short_description = "Вернуть на модерацию"
    action.__name__ = f"set_pending_{entity_type}"
    return action


# ── Общие поля и методы ────────────────────────────────────────────

class BaseEntityAdmin(admin.ModelAdmin):
    """Базовый класс для Startups, Franchises, Agencies, Specialists."""

    list_per_page = 30
    save_on_top = True

    # Map model → (entity_type, pk_field) for notification routing
    _ENTITY_TYPE_MAP = {
        "Startups": ("startup", "startup_id"),
        "Franchises": ("franchise", "franchise_id"),
        "Agencies": ("agency", "agency_id"),
        "Specialists": ("specialist", "specialist_id"),
    }

    def save_model(self, request, obj, form, change):
        """Detect status → approved transition and trigger Telegram notification."""
        old_status = None
        if change and "status" in form.changed_data:
            old_status = form.initial.get("status")

        super().save_model(request, obj, form, change)

        # If status just changed to "approved", trigger full approval flow
        if old_status and old_status != "approved" and obj.status == "approved":
            model_name = obj.__class__.__name__
            entity_info = self._ENTITY_TYPE_MAP.get(model_name)
            if entity_info:
                entity_type, pk_field = entity_info
                entity_id = getattr(obj, pk_field, obj.pk)

                # Log, invalidate cache, send notification
                from .moderation import _log_moderation_action, _invalidate_cache
                _log_moderation_action(
                    moderator=request.user,
                    action="approve",
                    entity_type=entity_type,
                    entity_id=entity_id,
                    entity_title=getattr(obj, "title", ""),
                    comment="Одобрено через Django Admin (save)",
                )
                _invalidate_cache()

                try:
                    from .tasks import notify_entity_approved
                    notify_entity_approved.delay(entity_type, entity_id)
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(
                        "Failed to queue entity notification: %s", e
                    )

    def avg_rating(self, obj):
        rating = obj.get_average_rating()
        if rating:
            return f"{rating:.1f}"
        return "—"
    avg_rating.short_description = "Рейтинг"

    def status_badge(self, obj):
        colors = {
            "approved": "#28a745",
            "pending": "#ffc107",
            "rejected": "#dc3545",
        }
        color = colors.get(obj.status, "#6c757d")
        labels = {
            "approved": "Одобрен",
            "pending": "На модерации",
            "rejected": "Отклонён",
        }
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, label,
        )
    status_badge.short_description = "Статус"
    status_badge.admin_order_field = "status"


# ── Startups ───────────────────────────────────────────────────────

@admin.register(Startups)
class StartupsAdmin(BaseEntityAdmin):
    list_display = ("title", "owner", "status_badge", "direction", "stage", "avg_rating", "total_voters", "created_at")
    list_filter = ("status", "direction", "stage", "created_at")
    search_fields = ("title", "description", "owner__first_name", "owner__last_name", "owner__email")
    readonly_fields = ("startup_id", "created_at", "updated_at", "total_voters", "sum_votes", "amount_raised", "total_invested")
    raw_id_fields = ("owner",)
    date_hierarchy = "created_at"
    inlines = [CommentsInline]
    actions = [
        _make_approve_action("startup"),
        _make_reject_action("startup"),
        _make_set_pending_action("startup"),
    ]

    fieldsets = (
        ("Основное", {
            "fields": ("title", "short_description", "description", "terms", "owner"),
        }),
        ("Классификация", {
            "fields": ("direction", "stage"),
        }),
        ("Финансы", {
            "fields": ("funding_goal", "amount_raised", "total_invested", "valuation", "percent_amount"),
        }),
        ("Медиа", {
            "fields": ("video_urls",),
            "description": "JSON-список ссылок на видео. Можно вставить прямой URL на S3, например: [\"https://storage.yandexcloud.net/bucket/video.mp4\"]",
        }),
        ("Модерация", {
            "fields": ("status", "moderator_comment", "status_id"),
        }),
        ("Рейтинг", {
            "fields": ("total_voters", "sum_votes"),
            "classes": ("collapse",),
        }),
        ("Метаданные", {
            "fields": ("startup_id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


# ── Franchises ─────────────────────────────────────────────────────

@admin.register(Franchises)
class FranchisesAdmin(BaseEntityAdmin):
    list_display = ("title", "owner", "status_badge", "direction", "avg_rating", "total_voters", "created_at")
    list_filter = ("status", "direction", "created_at")
    search_fields = ("title", "description", "owner__first_name", "owner__last_name")
    readonly_fields = ("franchise_id", "created_at", "updated_at", "total_voters", "sum_votes", "total_invested")
    raw_id_fields = ("owner",)
    date_hierarchy = "created_at"
    inlines = [FranchiseCommentsInline]
    actions = [
        _make_approve_action("franchise"),
        _make_reject_action("franchise"),
        _make_set_pending_action("franchise"),
    ]

    fieldsets = (
        ("Основное", {
            "fields": ("title", "short_description", "description", "terms", "owner"),
        }),
        ("Классификация", {
            "fields": ("direction", "stage"),
        }),
        ("Финансы", {
            "fields": ("investment_size", "franchise_cost", "payback_period", "total_invested", "valuation"),
        }),
        ("Медиа", {
            "fields": ("video_urls",),
            "description": "JSON-список ссылок на видео. Можно вставить прямой URL на S3, например: [\"https://storage.yandexcloud.net/bucket/video.mp4\"]",
        }),
        ("Модерация", {
            "fields": ("status", "moderator_comment", "status_id"),
        }),
        ("Рейтинг", {
            "fields": ("total_voters", "sum_votes"),
            "classes": ("collapse",),
        }),
        ("Метаданные", {
            "fields": ("franchise_id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


# ── Agencies ───────────────────────────────────────────────────────

@admin.register(Agencies)
class AgenciesAdmin(BaseEntityAdmin):
    list_display = ("title", "owner", "status_badge", "direction", "avg_rating", "total_voters", "created_at")
    list_filter = ("status", "direction", "created_at")
    search_fields = ("title", "description", "owner__first_name", "owner__last_name")
    readonly_fields = ("agency_id", "created_at", "updated_at", "total_voters", "sum_votes")
    raw_id_fields = ("owner",)
    date_hierarchy = "created_at"
    inlines = [AgencyCommentsInline]
    actions = [
        _make_approve_action("agency"),
        _make_reject_action("agency"),
        _make_set_pending_action("agency"),
    ]

    fieldsets = (
        ("Основное", {
            "fields": ("title", "short_description", "description", "terms", "owner"),
        }),
        ("Классификация", {
            "fields": ("direction", "stage"),
        }),
        ("Медиа", {
            "fields": ("video_urls",),
            "description": "JSON-список ссылок на видео. Пример: [\"https://storage.yandexcloud.net/bucket/video.mp4\"]",
        }),
        ("Модерация", {
            "fields": ("status", "moderator_comment"),
        }),
        ("Рейтинг", {
            "fields": ("total_voters", "sum_votes"),
            "classes": ("collapse",),
        }),
        ("Метаданные", {
            "fields": ("agency_id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


# ── Specialists ────────────────────────────────────────────────────

@admin.register(Specialists)
class SpecialistsAdmin(BaseEntityAdmin):
    list_display = ("title", "owner", "status_badge", "direction", "avg_rating", "total_voters", "created_at")
    list_filter = ("status", "direction", "created_at")
    search_fields = ("title", "description", "owner__first_name", "owner__last_name")
    readonly_fields = ("specialist_id", "created_at", "updated_at", "total_voters", "sum_votes")
    raw_id_fields = ("owner",)
    date_hierarchy = "created_at"
    inlines = [SpecialistCommentsInline]
    actions = [
        _make_approve_action("specialist"),
        _make_reject_action("specialist"),
        _make_set_pending_action("specialist"),
    ]

    fieldsets = (
        ("Основное", {
            "fields": ("title", "short_description", "description", "terms", "owner"),
        }),
        ("Классификация", {
            "fields": ("direction", "stage"),
        }),
        ("Медиа", {
            "fields": ("video_urls",),
            "description": "JSON-список ссылок на видео. Пример: [\"https://storage.yandexcloud.net/bucket/video.mp4\"]",
        }),
        ("Модерация", {
            "fields": ("status", "moderator_comment"),
        }),
        ("Рейтинг", {
            "fields": ("total_voters", "sum_votes"),
            "classes": ("collapse",),
        }),
        ("Метаданные", {
            "fields": ("specialist_id", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


# ── Users ──────────────────────────────────────────────────────────

@admin.register(Users)
class UsersAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name", "role", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_active", "is_staff", "created_at")
    search_fields = ("email", "first_name", "last_name", "username", "phone")
    readonly_fields = ("user_id", "created_at", "updated_at", "last_login", "telegram_id")
    list_per_page = 30

    fieldsets = (
        ("Основное", {
            "fields": ("email", "username", "first_name", "last_name", "phone"),
        }),
        ("Роль и статус", {
            "fields": ("role", "status", "is_active", "is_staff"),
        }),
        ("Профиль", {
            "fields": ("bio", "rating", "profile_picture_url", "website_url", "vk_url", "linkedin_url"),
            "classes": ("collapse",),
        }),
        ("Telegram", {
            "fields": ("telegram_id", "telegram_email"),
            "classes": ("collapse",),
        }),
        ("Метаданные", {
            "fields": ("user_id", "created_at", "updated_at", "last_login"),
            "classes": ("collapse",),
        }),
    )


# ── ModerationLog (Audit Trail) ───────────────────────────────────

@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "moderator", "action_badge", "entity_type_display", "entity_id", "entity_title_short")
    list_filter = ("action", "entity_type", "created_at")
    search_fields = ("entity_title", "comment", "moderator__first_name", "moderator__last_name")
    readonly_fields = ("log_id", "moderator", "action", "entity_type", "entity_id", "entity_title", "comment", "created_at")
    date_hierarchy = "created_at"
    list_per_page = 50
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return getattr(request.user, 'is_superuser', False)

    def action_badge(self, obj):
        colors = {
            "approve": "#28a745",
            "reject": "#dc3545",
            "delete_comment": "#fd7e14",
            "edit": "#17a2b8",
            "status_change": "#6c757d",
        }
        color = colors.get(obj.action, "#6c757d")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px">{}</span>',
            color, obj.get_action_display(),
        )
    action_badge.short_description = "Действие"
    action_badge.admin_order_field = "action"

    def entity_type_display(self, obj):
        return obj.get_entity_type_display()
    entity_type_display.short_description = "Тип объекта"
    entity_type_display.admin_order_field = "entity_type"

    def entity_title_short(self, obj):
        if len(obj.entity_title) > 50:
            return obj.entity_title[:50] + "..."
        return obj.entity_title
    entity_title_short.short_description = "Название"


# ── Справочники ────────────────────────────────────────────────────

@admin.register(Directions)
class DirectionsAdmin(admin.ModelAdmin):
    list_display = ("direction_id", "direction_name")
    search_fields = ("direction_name",)


@admin.register(ReviewStatuses)
class ReviewStatusesAdmin(admin.ModelAdmin):
    list_display = ("status_id", "status_name")


# ── News ──────────────────────────────────────────────────────────

class NewsCommentsInline(admin.TabularInline):
    model = NewsComments
    fk_name = "article"
    extra = 0
    readonly_fields = ("comment_id", "user", "content", "user_rating", "created_at")
    fields = ("user", "content", "user_rating", "created_at")
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(NewsArticles)
class NewsArticlesAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "status_badge", "content_type", "category", "entity_focus", "is_featured", "published_at")
    list_filter = ("status", "content_type", "entity_focus", "category", "is_featured", "published_at")
    search_fields = ("title", "content", "tags", "author__first_name", "author__last_name")
    readonly_fields = ("article_id", "published_at", "updated_at", "views_count", "likes_count")
    raw_id_fields = ("author",)
    date_hierarchy = "published_at"
    list_per_page = 30
    save_on_top = True
    inlines = [NewsCommentsInline]

    fieldsets = (
        ("Основное", {
            "fields": ("title", "slug", "content", "author"),
        }),
        ("Классификация", {
            "fields": ("category", "tags", "is_featured"),
        }),
        ("Статус", {
            "fields": ("status", "scheduled_at"),
        }),
        ("Медиа", {
            "fields": ("image_url",),
        }),
        ("Статистика", {
            "fields": ("views_count", "likes_count"),
            "classes": ("collapse",),
        }),
        ("Метаданные", {
            "fields": ("article_id", "published_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def status_badge(self, obj):
        colors = {
            "published": "#28a745",
            "draft": "#ffc107",
            "archived": "#6c757d",
        }
        labels = {
            "published": "Опубликована",
            "draft": "Черновик",
            "archived": "В архиве",
        }
        color = colors.get(obj.status, "#6c757d")
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, label,
        )
    status_badge.short_description = "Статус"
    status_badge.admin_order_field = "status"

    def views_count(self, obj):
        from .models import NewsViews
        return NewsViews.objects.filter(article=obj).count()
    views_count.short_description = "Просмотры"

    def likes_count(self, obj):
        from .models import NewsLikes
        return NewsLikes.objects.filter(article=obj).count()
    likes_count.short_description = "Лайки"

    # ── Content pipeline: publish from content/articles/ ───────────
    change_list_template = "admin/news_articles_changelist.html"

    def get_urls(self):
        custom_urls = [
            path(
                "pipeline/",
                self.admin_site.admin_view(self.pipeline_view),
                name="news_pipeline",
            ),
            path(
                "pipeline/publish/",
                self.admin_site.admin_view(self.pipeline_publish),
                name="news_pipeline_publish",
            ),
        ]
        return custom_urls + super().get_urls()

    def _articles_dir(self):
        return Path(__file__).resolve().parent.parent / "content" / "articles"

    def _published_log(self):
        return self._articles_dir() / ".published"

    def _get_published(self):
        log = self._published_log()
        if not log.exists():
            return set()
        return set(log.read_text(encoding="utf-8").strip().splitlines())

    def _get_pipeline_articles(self):
        """Return list of articles available in the content pipeline."""
        articles_dir = self._articles_dir()
        if not articles_dir.exists():
            return []
        published = self._get_published()
        result = []
        files = sorted(
            f for f in os.listdir(articles_dir)
            if f.endswith(".json") and not f.startswith("_")
        )
        for fname in files:
            try:
                with open(articles_dir / fname, "r", encoding="utf-8") as f:
                    data = json.load(f)
                result.append({
                    "filename": fname,
                    "title": data.get("title", "Без заголовка"),
                    "category": data.get("category_slug", ""),
                    "tags": data.get("tags", ""),
                    "is_published": fname in published,
                })
            except (json.JSONDecodeError, OSError):
                continue
        return result

    def pipeline_view(self, request):
        """Page listing all pipeline articles with publish buttons."""
        articles = self._get_pipeline_articles()
        context = {
            **self.admin_site.each_context(request),
            "title": "Контент-пайплайн",
            "articles": articles,
        }
        return TemplateResponse(request, "admin/news_pipeline.html", context)

    def _upload_to_s3(self, file_path, s3_key):
        """Upload a local file to S3 and return the relative key."""
        access_key = getattr(settings, "AWS_ACCESS_KEY_ID", "")
        secret_key = getattr(settings, "AWS_SECRET_ACCESS_KEY", "")
        bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")
        endpoint = getattr(settings, "AWS_S3_ENDPOINT_URL", "https://storage.yandexcloud.net")

        if not access_key or not secret_key or not bucket:
            logger.warning("S3 credentials not configured, skipping upload")
            return None

        ext = file_path.suffix.lower().lstrip(".")
        content_type = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")

        try:
            s3 = boto3.client(
                "s3",
                endpoint_url=endpoint,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name="ru-central1",
                config=BotoConfig(signature_version="s3v4"),
            )
            with open(file_path, "rb") as f:
                s3.put_object(
                    Bucket=bucket,
                    Key=s3_key,
                    Body=f.read(),
                    ContentType=content_type,
                    ACL="public-read",
                )
            logger.info("Uploaded to S3: %s", s3_key)
            return s3_key
        except Exception as e:
            logger.error("S3 upload failed for %s: %s", s3_key, e)
            return None

    def _images_dir(self):
        return Path(__file__).resolve().parent.parent / "content" / "images"

    def pipeline_publish(self, request):
        """AJAX endpoint to publish a specific article with S3 images."""
        if request.method != "POST":
            return JsonResponse({"error": "POST only"}, status=405)

        filename = request.POST.get("filename")
        if not filename:
            return JsonResponse({"error": "No filename"}, status=400)

        articles_dir = self._articles_dir()
        filepath = articles_dir / filename

        if not filepath.exists():
            return JsonResponse({"error": f"File not found: {filename}"}, status=404)

        published = self._get_published()
        if filename in published:
            return JsonResponse({"error": "Already published"}, status=400)

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            return JsonResponse({"error": str(e)}, status=400)

        from .models import NewsArticles, NewsCategories

        title = data.get("title", "")[:255]
        content = data.get("content", "")
        tags = data.get("tags", "")[:255]
        category_slug = data.get("category_slug", "")
        content_type = data.get("content_type", "article")
        entity_focus = data.get("entity_focus", "franchise")
        section_images = data.get("section_images", [])

        if not title or not content:
            return JsonResponse({"error": "Empty title or content"}, status=400)

        # ── Upload images to S3 ──────────────────────────────
        slug = filepath.stem  # e.g. "001_kak-vybrat-franshizu..."
        img_dir = self._images_dir() / slug
        base_url = getattr(settings, "S3_PUBLIC_BASE_URL", "")
        cover_image_url = None

        # Upload cover
        cover_path = img_dir / "cover.jpg"
        if cover_path.exists():
            s3_key = f"news/articles/{slug}/cover.jpg"
            if self._upload_to_s3(cover_path, s3_key):
                cover_image_url = s3_key

        # Upload section images and insert <img> tags into content
        for idx, spec in enumerate(section_images):
            img_path = img_dir / f"section_{idx + 1}.jpg"
            if not img_path.exists():
                continue

            s3_key = f"news/articles/{slug}/section_{idx + 1}.jpg"
            if not self._upload_to_s3(img_path, s3_key):
                continue

            full_url = f"{base_url}/{s3_key}"
            alt = spec.get("alt", spec.get("title", ""))
            img_tag = f'<img src="{full_url}" alt="{alt}" loading="lazy" decoding="async">'

            # Insert after the Nth </h2> tag (after_section)
            after_section = spec.get("after_section", idx + 1)
            h2_pattern = r"(</h2>)"
            parts = re.split(h2_pattern, content)
            # parts = [before_h2, </h2>, between, </h2>, ...]
            # We need to insert after the Nth </h2>
            h2_count = 0
            new_parts = []
            inserted = False
            for part in parts:
                new_parts.append(part)
                if part == "</h2>":
                    h2_count += 1
                    if h2_count == after_section and not inserted:
                        new_parts.append(f"\n{img_tag}\n")
                        inserted = True
            content = "".join(new_parts)

        # ── Create article ────────────────────────────────────
        category = None
        if category_slug:
            category = NewsCategories.objects.filter(slug=category_slug).first()

        now = timezone.now()
        article = NewsArticles(
            title=title,
            content=content,
            tags=tags,
            status="published",
            content_type=content_type,
            entity_focus=entity_focus,
            category=category,
            image_url=cover_image_url,
            published_at=now,
            updated_at=now,
        )
        article.save()

        # Mark as published
        with open(self._published_log(), "a", encoding="utf-8") as f:
            f.write(filename + "\n")

        return JsonResponse({
            "success": True,
            "article_id": article.article_id,
            "title": article.title,
            "slug": article.slug,
        })


@admin.register(NewsCategories)
class NewsCategoriesAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sort_order", "articles_count")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("sort_order",)

    def articles_count(self, obj):
        return NewsArticles.objects.filter(category=obj, status="published").count()
    articles_count.short_description = "Статей"


# ── Закреплённые карточки и реклама ──────────────────────────────

@admin.register(PinnedCatalogItem)
class PinnedCatalogItemAdmin(admin.ModelAdmin):
    list_display = ("id", "position", "entity_type", "entity_id", "entity_title_display", "is_active", "updated_at")
    list_display_links = ("id",)
    list_filter = ("entity_type", "is_active")
    list_editable = ("position", "is_active")
    ordering = ("entity_type", "position")

    def entity_title_display(self, obj):
        entity = obj.get_entity()
        return entity.title if entity else "— не найдено —"
    entity_title_display.short_description = "Название"


@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ("location", "entity_type", "entity_id", "entity_title_display", "is_active", "date_range_display", "sort_order")
    list_filter = ("location", "entity_type", "is_active")
    list_editable = ("is_active", "sort_order")
    ordering = ("location", "sort_order")

    fieldsets = (
        ("Сущность", {"fields": ("entity_type", "entity_id", "location")}),
        ("Переопределения", {"fields": ("title", "description"), "classes": ("collapse",)}),
        ("Расписание", {"fields": ("is_active", "start_date", "end_date", "sort_order")}),
    )

    def entity_title_display(self, obj):
        entity = obj.get_entity()
        return entity.title if entity else "— не найдено —"
    entity_title_display.short_description = "Название"

    def date_range_display(self, obj):
        if obj.start_date and obj.end_date:
            return f"{obj.start_date} — {obj.end_date}"
        elif obj.start_date:
            return f"с {obj.start_date}"
        elif obj.end_date:
            return f"до {obj.end_date}"
        return "Бессрочно"
    date_range_display.short_description = "Период"


# ── Заявки (Lead Generation) ────────────────────────────────────

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("lead_id", "entity_type_display", "entity_title_short", "lead_type_display", "name", "email", "status_badge", "created_at")
    list_filter = ("entity_type", "lead_type", "status", "created_at")
    search_fields = ("name", "email", "phone", "message")
    readonly_fields = ("lead_id", "created_at", "viewed_at", "responded_at")
    raw_id_fields = ("user", "entity_owner")
    date_hierarchy = "created_at"
    list_per_page = 50
    ordering = ("-created_at",)

    fieldsets = (
        ("Заявка", {
            "fields": ("entity_type", "entity_id", "lead_type", "status"),
        }),
        ("Контактные данные", {
            "fields": ("name", "email", "phone", "budget_range", "message"),
        }),
        ("Участники", {
            "fields": ("user", "entity_owner"),
        }),
        ("Метаданные", {
            "fields": ("lead_id", "created_at", "viewed_at", "responded_at"),
            "classes": ("collapse",),
        }),
    )

    def status_badge(self, obj):
        colors = {
            "new": "#007bff",
            "viewed": "#ffc107",
            "responded": "#28a745",
            "converted": "#6f42c1",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_status_display(),
        )
    status_badge.short_description = "Статус"
    status_badge.admin_order_field = "status"

    def entity_type_display(self, obj):
        return obj.get_entity_type_display()
    entity_type_display.short_description = "Тип"

    def lead_type_display(self, obj):
        return obj.get_lead_type_display()
    lead_type_display.short_description = "Тип заявки"

    def entity_title_short(self, obj):
        title = obj.get_entity_title()
        return title[:40] + "..." if len(title) > 40 else title
    entity_title_short.short_description = "Объект"


# ── География франшиз ──────────────────────────────────────

class FranchiseLocationInline(admin.TabularInline):
    model = FranchiseLocation
    extra = 1
    fields = ("city", "status", "opened_at", "initial_investment", "monthly_revenue", "monthly_profit", "note")
    raw_id_fields = ("city",)


# Add locations inline to FranchisesAdmin
FranchisesAdmin.inlines = list(getattr(FranchisesAdmin, 'inlines', [])) + [FranchiseLocationInline]


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "population", "is_major", "franchise_count")
    list_filter = ("region", "is_major")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    def franchise_count(self, obj):
        return obj.franchise_locations.filter(status="active").count()
    franchise_count.short_description = "Франшиз"


@admin.register(FranchiseLocation)
class FranchiseLocationAdmin(admin.ModelAdmin):
    list_display = ("franchise", "city", "status", "opened_at", "monthly_profit", "initial_investment", "payback_display")
    list_filter = ("status", "city__region", "city__is_major")
    search_fields = ("franchise__title", "city__name")
    raw_id_fields = ("franchise", "city")
    date_hierarchy = "opened_at"

    def payback_display(self, obj):
        months = obj.get_payback_months()
        if months:
            return f"{months} мес."
        return "—"
    payback_display.short_description = "Окупаемость"


# ── SEO Article Generation Log ──────────────────────────────

@admin.register(ArticleTopicLog)
class ArticleTopicLogAdmin(admin.ModelAdmin):
    list_display = ("topic_id", "article_type", "article_type_params", "generated_article", "created_at")
    list_filter = ("article_type", "created_at")
    readonly_fields = ("topic_id", "param_hash", "created_at")
    raw_id_fields = ("generated_article",)
    ordering = ("-created_at",)
