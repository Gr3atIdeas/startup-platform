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
