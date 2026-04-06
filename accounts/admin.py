from django.contrib import admin
from django.utils.html import format_html

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
        return request.user.is_superuser

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
