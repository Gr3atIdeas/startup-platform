import logging
import os
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models, connection
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings
from accounts.utils import get_file_url, is_uuid
logger = logging.getLogger(__name__)
class Actions(models.Model):
    action_id = models.AutoField(primary_key=True)
    action_name = models.CharField(unique=True, max_length=100)
    class Meta:
        managed = False
        db_table = "actions"
class ActivityLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    action = models.ForeignKey(Actions, models.DO_NOTHING, blank=True, null=True)
    details = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "activity_log"
def creative_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    base_name = slugify(os.path.splitext(filename)[0])[:50]
    new_filename = f"creative_{instance.entity_id}_{base_name}{ext}"
    return f"startups/{instance.entity_id}/creatives/{new_filename}"
def proof_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    base_name = slugify(os.path.splitext(filename)[0])[:50]
    new_filename = f"proof_{instance.entity_id}_{base_name}{ext}"
    return f"startups/{instance.entity_id}/proofs/{new_filename}"
def video_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    base_name = slugify(os.path.splitext(filename)[0])[:50]
    new_filename = f"video_{instance.entity_id}_{base_name}{ext}"
    return f"startups/{instance.entity_id}/videos/{new_filename}"
class Comments(models.Model):
    comment_id = models.AutoField(primary_key=True)
    startup_id = models.ForeignKey(
        "Startups",
        on_delete=models.CASCADE,
        db_column="startup_id",
        related_name="comments",
    )
    user_id = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    content = models.TextField()
    user_rating = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent_comment_id = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="parent_comment_id",
    )
    class Meta:
        managed = False
        db_table = "comments"
    def __str__(self):
        return f"Comment {self.comment_id} by {self.user_id}"
class Directions(models.Model):
    direction_id = models.AutoField(primary_key=True)
    direction_name = models.CharField(max_length=255, blank=True, null=True)
    def __str__(self):
        name = self.direction_name or "Не указано"
        if isinstance(name, bytes):
            name = name.decode("utf-8", errors="replace")
        return name
    class Meta:
        managed = False
        db_table = "directions"
class EntityTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "entity_types"
class FileStorage(models.Model):
    file_id = models.AutoField(primary_key=True)
    entity_type = models.ForeignKey(
        EntityTypes, models.DO_NOTHING, blank=True, null=True
    )
    entity_id = models.IntegerField(blank=True, null=True)
    file_url = models.CharField(
        max_length=1000, blank=True, null=True
    )
    file_type = models.ForeignKey("FileTypes", models.DO_NOTHING, blank=True, null=True)
    uploaded_at = models.DateTimeField(blank=True, null=True)
    startup = models.ForeignKey("Startups", models.CASCADE, blank=True, null=True)
    original_file_name = models.CharField(
        max_length=255, blank=True, null=True
    )
    class Meta:
        managed = True
        db_table = "file_storage"
class FileTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "file_types"
class InvestmentTransactions(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey("Startups", models.DO_NOTHING, blank=True, null=True)
    franchise = models.ForeignKey("Franchises", models.DO_NOTHING, blank=True, null=True)
    investor = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    amount = models.DecimalField(max_digits=19, decimal_places=4)
    is_micro = models.BooleanField(blank=True, null=True)
    transaction_type = models.ForeignKey(
        "TransactionTypes", models.DO_NOTHING, blank=True, null=True
    )
    payment_gateway_response = models.JSONField(blank=True, null=True)
    transaction_status = models.CharField(max_length=50, blank=True, null=True)
    payment_method = models.ForeignKey(
        "PaymentMethods", models.DO_NOTHING, blank=True, null=True
    )
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "investment_transactions"
class LegalPages(models.Model):
    page_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    version = models.CharField(max_length=50, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "legal_pages"
class MessageStatuses(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "message_statuses"
class NotificationTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=100)
    class Meta:
        managed = False
        db_table = "notification_types"
class Notifications(models.Model):
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    type = models.ForeignKey(
        NotificationTypes, models.DO_NOTHING, blank=True, null=True
    )
    message = models.TextField()
    is_read = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    read_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "notifications"
class PaymentMethods(models.Model):
    method_id = models.AutoField(primary_key=True)
    method_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "payment_methods"
class PlanetCustomizations(models.Model):
    customization_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey("Startups", models.DO_NOTHING, blank=True, null=True)
    top_part = models.CharField(max_length=100, blank=True, null=True)
    middle_part = models.CharField(max_length=100, blank=True, null=True)
    bottom_part = models.CharField(max_length=100, blank=True, null=True)
    class Meta:
        managed = False
        db_table = "planet_customizations"
class Roles(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(unique=True, max_length=50)
    def __str__(self):
        return self.role_name
    class Meta:
        managed = False
        db_table = "roles"
class StartupStages(models.Model):
    stage_id = models.AutoField(primary_key=True)
    stage_name = models.CharField(max_length=255, blank=True, null=True)
    def __str__(self):
        name = self.stage_name or "Не указано"
        if isinstance(name, bytes):
            name = name.decode("utf-8", errors="replace")
        return name
    class Meta:
        managed = False
        db_table = "startup_stages"
class StartupTimeline(models.Model):
    event_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey("Startups", models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    event_date = models.DateTimeField(blank=True, null=True)
    step_number = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = "startup_timeline"
class StartupVotes(models.Model):
    vote_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey("Startups", models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    vote_value = models.ForeignKey(
        "VoteTypes", models.DO_NOTHING, db_column="vote_value", blank=True, null=True
    )
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "startup_votes"
        unique_together = (("user", "startup"),)
class UserVotes(models.Model):
    vote_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    startup = models.ForeignKey(
        "Startups", on_delete=models.CASCADE, db_column="startup_id", blank=True, null=True
    )
    rating = models.IntegerField(db_column="vote_value")
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        db_table = "startup_votes"
        unique_together = ("user", "startup")
        managed = False
    def __str__(self):
        return f"{self.user.email} - {self.startup.title}: {self.rating}"


class FranchiseVotes(models.Model):
    vote_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    franchise = models.ForeignKey(
        "Franchises", on_delete=models.CASCADE, db_column="franchise_id", blank=True, null=True
    )
    rating = models.IntegerField(db_column="vote_value")
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "franchise_votes"
        unique_together = ("user", "franchise")
        managed = True

    def __str__(self):
        return f"{self.user.email} - {getattr(self.franchise, 'title', '')}: {self.rating}"
class Subscriptions(models.Model):
    subscription_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    plan_name = models.CharField(max_length=100)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    payment_method = models.ForeignKey(
        PaymentMethods, models.DO_NOTHING, blank=True, null=True
    )
    amount = models.DecimalField(max_digits=19, decimal_places=4)
    renewal_date = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "subscriptions"
class TransactionTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "transaction_types"
class UserInterests(models.Model):
    interest_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    startup = models.ForeignKey("Startups", models.DO_NOTHING, blank=True, null=True)
    interest_type = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "user_interests"
        unique_together = (("user", "startup", "interest_type"),)
class UserSettings(models.Model):
    setting_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    setting_key = models.CharField(max_length=100)
    setting_value = models.CharField(max_length=255)
    class Meta:
        managed = False
        db_table = "user_settings"
class UserStatuses(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "user_statuses"
class VoteTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "vote_types"
class ReviewStatuses(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = "review_statuses"
    def __str__(self):
        return self.status_name
class Startups(models.Model):
    startup_id = models.AutoField(primary_key=True)
    owner = models.ForeignKey(
        "Users", models.DO_NOTHING, blank=True, null=True, db_column="owner_id"
    )
    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    direction = models.ForeignKey(
        "Directions", models.DO_NOTHING, blank=True, null=True, db_column="direction_id"
    )
    stage = models.ForeignKey(
        "StartupStages", models.DO_NOTHING, blank=True, null=True, db_column="stage_id"
    )
    funding_goal = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True
    )
    amount_raised = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True
    )
    valuation = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True
    )
    pitch_deck_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, default="pending")
    status_id = models.ForeignKey(
        "ReviewStatuses",
        models.DO_NOTHING,
        blank=True,
        null=True,
        db_column="status_id",
        default=3,
    )
    only_invest = models.BooleanField(default=False)
    only_buy = models.BooleanField(default=False)
    both_mode = models.BooleanField(default=False)
    total_invested = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True, default=0
    )
    info_url = models.CharField(max_length=255, blank=True, null=True)
    percent_amount = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True
    )
    customization_data = models.JSONField(blank=True, null=True)
    micro_investment_available = models.BooleanField(default=False)
    total_voters = models.IntegerField(default=0)
    sum_votes = models.IntegerField(default=0)
    is_edited = models.BooleanField(default=False)
    moderator_comment = models.TextField(blank=True, null=True)
    for_sale = models.BooleanField(default=False)
    step_number = models.IntegerField(default=1)
    logo_urls = models.JSONField(default=list)
    creatives_urls = models.JSONField(blank=True, null=True, default=list)
    proofs_urls = models.JSONField(blank=True, null=True, default=list)
    video_urls = models.JSONField(blank=True, null=True, default=list)
    planet_image = models.CharField(max_length=50, blank=True, null=True)
    slider_images = models.JSONField(blank=True, null=True, default=list)
    catalog_card_image = models.CharField(max_length=255, blank=True, null=True)
    contact_website = models.URLField(max_length=500, blank=True, null=True)
    contact_telegram = models.CharField(max_length=255, blank=True, null=True)
    contact_whatsapp = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True, null=True)
    class Meta:
        managed = True
        db_table = "startups"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_startups_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_startups_owner_status'),
            models.Index(fields=['status', 'direction'], name='idx_startups_status_dir'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug and self.title:
            from django.utils.text import slugify
            transliterated = NewsArticles._transliterate(self.title)
            base_slug = slugify(transliterated)[:270]
            if not base_slug:
                base_slug = f"startup-{self.startup_id or 'new'}"
            slug = base_slug
            counter = 2
            while Startups.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse("startup_detail", kwargs={"slug": self.slug or self.startup_id})

    def get_average_rating(self):
        # Считаем реальный средний рейтинг из голосов
        from django.db.models import Avg
        avg = UserVotes.objects.filter(startup=self).aggregate(avg_rating=Avg('rating'))['avg_rating']
        if avg is not None:
            return float(avg)
        # Fallback на кэшированные значения
        if self.total_voters > 0:
            return float(self.sum_votes) / self.total_voters
        return 0.0
    def get_logo_url(self):
        if (
            self.logo_urls
            and isinstance(self.logo_urls, list)
            and len(self.logo_urls) > 0
        ):
            return get_file_url(self.logo_urls[0], self.startup_id, "logo")
        return None
    
    def get_catalog_card_image_url(self):
        if self.catalog_card_image:
            return f"{settings.AWS_S3_PUBLIC_BASE_URL}/catalog_cards/{self.catalog_card_image}"
        return None
    def get_investors_count(self):
        return (
            InvestmentTransactions.objects.filter(
                startup=self
            )
            .defer("franchise")
            .values("investor_id")
            .distinct()
            .count()
        )
    def get_progress_percentage(self):
        if self.funding_goal and self.funding_goal > 0:
            amount_raised = self.amount_raised or 0
            try:
                percentage = (amount_raised / self.funding_goal) * 100
                capped_percentage = min(max(percentage, 0), 100)
                return round(capped_percentage)
            except (TypeError, ZeroDivisionError, ValueError):
                return 0
        return 0
    def get_status_display(self):
        statuses = {
            "pending": "На рассмотрении",
            "approved": "Одобрен",
            "rejected": "Отклонён",
            "blocked": "Заблокирован",
            "closed": "Закрыт",
        }
        return statuses.get(self.status, "Неизвестен")
class ModeratorReviews(models.Model):
    review_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey(Startups, models.DO_NOTHING, blank=True, null=True)
    moderator = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    review_status = models.ForeignKey(
        ReviewStatuses, models.DO_NOTHING, blank=True, null=True
    )
    comments = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = "moderator_reviews"
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, first_name=None, last_name=None, phone=None, role_id=None, telegram_id=None, **extra_fields):
        if not email and not telegram_id:
            raise ValueError("Email или Telegram ID обязателен")
        email = self.normalize_email(email) if email else None
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role_id=role_id,
            telegram_id=telegram_id,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.password_hash = None
        user.save(using=self._db)
        return user
    def create_superuser(self, email, password, first_name=None, last_name=None, **extra_fields):
        if not email:
            raise ValueError("Email обязателен для суперпользователя")
        user = self.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True,
            is_active=True,
            **extra_fields
        )
        user.is_staff = True
        user.save(using=self._db)
        return user
class Users(AbstractBaseUser):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, max_length=255, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.ForeignKey("Roles", models.SET_NULL, blank=True, null=True, db_column="role_id")
    profile_picture_url = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    rating = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    status = models.ForeignKey("UserStatuses", models.SET_DEFAULT, default=1, blank=True, null=True, db_column="status_id")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    show_phone = models.BooleanField(default=False)
    website_url = models.CharField(max_length=255, blank=True, null=True)
    social_links = models.JSONField(blank=True, null=True, default=dict)
    telegram_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    telegram_email = models.CharField(max_length=255, blank=True, null=True)
    vk_url = models.CharField(max_length=255, blank=True, null=True)
    linkedin_url = models.CharField(max_length=255, blank=True, null=True)
    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]
    class Meta:
        db_table = "users"
    def __str__(self):
        return self.email or f"User {self.user_id}"
    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)
    def check_password(self, raw_password):
        if not self.password_hash or raw_password is None:
            return False
        return check_password(raw_password, self.password_hash)
    def get_full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip()
    @property
    def password(self):
        return self.password_hash
    @password.setter
    def password(self, value):
        self.set_password(value)
    def has_perm(self, perm, obj=None):
        return self.is_staff
    def has_module_perms(self, app_label):
        return self.is_staff
    def get_profile_picture_url(self):
        url_value = (self.profile_picture_url or "").strip()
        if not url_value:
            return None
        if is_uuid(url_value):
            return get_file_url(url_value, self.user_id, "avatar")
        lowered = url_value.lower()
        if lowered.startswith("http://") or lowered.startswith("https://"):
            return url_value
        if lowered.startswith("/media/") or lowered.startswith("media/"):
            return url_value if url_value.startswith("/") else f"/{url_value}"
        return None
    def is_telegram_authenticated(self):
        return bool(self.telegram_id)
    def update_last_login(self):
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])
class NewsCategories(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = "news_categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class NewsArticles(models.Model):
    STATUS_CHOICES = [
        ("draft", "Черновик"),
        ("pending", "На модерации"),
        ("published", "Опубликована"),
        ("rejected", "Отклонена"),
        ("archived", "В архиве"),
    ]

    ENTITY_TYPE_CHOICES = [
        ("personal", "Личная"),
        ("startup", "Стартап"),
        ("franchise", "Франшиза"),
    ]

    CONTENT_TYPE_CHOICES = [
        ("news", "Новость"),
        ("article", "Статья"),
    ]

    ENTITY_FOCUS_CHOICES = [
        ("", "Общее"),
        ("franchise", "Франшизы"),
        ("startup", "Стартапы"),
        ("agency", "Агентства"),
        ("specialist", "Специалисты"),
    ]

    article_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    image_url = models.CharField(max_length=1000, blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="published")
    category = models.ForeignKey(
        "NewsCategories",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        db_column="category_id",
        related_name="articles",
    )
    is_featured = models.BooleanField(default=False)
    scheduled_at = models.DateTimeField(blank=True, null=True)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES, default="personal", blank=True, null=True)
    linked_startup = models.ForeignKey("Startups", on_delete=models.SET_NULL, blank=True, null=True, db_column="linked_startup_id", related_name="news_articles")
    linked_franchise = models.ForeignKey("Franchises", on_delete=models.SET_NULL, blank=True, null=True, db_column="linked_franchise_id", related_name="news_articles")
    rejection_reason = models.TextField(blank=True, null=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default="news")
    entity_focus = models.CharField(max_length=20, choices=ENTITY_FOCUS_CHOICES, default="", blank=True)

    class Meta:
        managed = False
        db_table = "news_articles"

    def __str__(self):
        return self.title

    @staticmethod
    def _transliterate(text):
        """Транслитерация кириллицы в латиницу для SEO-friendly slug."""
        mapping = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
            'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
            'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
            'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
            'э': 'e', 'ю': 'yu', 'я': 'ya',
        }
        result = []
        for char in text.lower():
            result.append(mapping.get(char, char))
        return ''.join(result)

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            transliterated = self._transliterate(self.title)
            base_slug = slugify(transliterated)[:270]
            if not base_slug:
                base_slug = "article"
            slug = base_slug
            counter = 2
            while NewsArticles.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse("news_detail", kwargs={"slug": self.slug})

    def get_image_url(self):
        """Генерирует полный URL для картинки новости."""
        if self.image_url:
            from django.conf import settings
            base_url = getattr(settings, "S3_PUBLIC_BASE_URL", "") + "/"
            return f"{base_url}{self.image_url}"
        return None

    def get_tags_list(self):
        """Возвращает теги как список."""
        if self.tags:
            return [t.strip() for t in self.tags.split(",") if t.strip()]
        return []


class NewsLikes(models.Model):
    like_id = models.AutoField(primary_key=True)
    article = models.ForeignKey("NewsArticles", models.CASCADE, db_column="article_id")
    user = models.ForeignKey("Users", models.CASCADE, db_column="user_id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "news_likes"
        unique_together = (("article", "user"),)


class NewsViews(models.Model):
    view_id = models.AutoField(primary_key=True)
    article = models.ForeignKey("NewsArticles", models.CASCADE, db_column="article_id")
    user = models.ForeignKey(
        "Users", models.CASCADE, db_column="user_id", null=True, blank=True
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "news_views"


class NewsComments(models.Model):
    comment_id = models.AutoField(primary_key=True)
    article = models.ForeignKey(
        "NewsArticles",
        on_delete=models.CASCADE,
        db_column="article_id",
        related_name="comments",
    )
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    content = models.TextField()
    user_rating = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="parent_comment_id",
    )

    class Meta:
        managed = False
        db_table = "news_comments"

    def __str__(self):
        return f"NewsComment {self.comment_id} by {self.user}"


class NewsDislikes(models.Model):
    dislike_id = models.AutoField(primary_key=True)
    article = models.ForeignKey("NewsArticles", models.CASCADE, db_column="article_id")
    user = models.ForeignKey("Users", models.CASCADE, db_column="user_id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "news_dislikes"
        unique_together = (("article", "user"),)


class ChatConversations(models.Model):
    conversation_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    is_group_chat = models.BooleanField(default=False)
    is_deal = models.BooleanField(default=False)
    deal_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Ожидает'),
            ('approved', 'Принята'),
            ('rejected', 'Отклонена')
        ],
        default='pending'
    )

    class Meta:
        managed = True
        db_table = "chat_conversations"

    def get_participants(self):
        return self.chatparticipants_set.all()

    def get_last_message(self):
        return self.messages_set.order_by("-created_at").first()


class ChatParticipants(models.Model):
    participant_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(
        ChatConversations, models.DO_NOTHING, blank=True, null=True
    )
    user = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "chat_participants"


class Messages(models.Model):
    message_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(
        ChatConversations, models.DO_NOTHING, blank=True, null=True
    )
    sender = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True)
    message_text = models.TextField()
    status = models.ForeignKey(
        MessageStatuses, models.DO_NOTHING, blank=True, null=True
    )
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "messages"

    def is_read(self):
        """Проверяет, прочитано ли сообщение."""
        return self.status.status_name == "read"
class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('new', 'Новая'),
        ('in_progress', 'В обработке'),
        ('closed', 'Закрыта'),
    ]
    ticket_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    moderator_comment = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'support_tickets'
        ordering = ['-created_at']
    def __str__(self):
        return f"Ticket #{self.ticket_id} by {self.user.username if self.user else 'Anonymous'}"


class ArticleTopicLog(models.Model):
    """Tracks generated SEO article topics to prevent repetition."""
    ARTICLE_TYPE_CHOICES = [
        ('top_category', 'Топ франшиз в категории'),
        ('city_review', 'Обзор франшиз в городе'),
        ('franchise_deep_dive', 'Подробный обзор франшизы'),
        ('cost_overview', 'Обзор стоимости франшиз'),
        ('budget_filter', 'Франшизы по бюджету'),
    ]
    topic_id = models.AutoField(primary_key=True)
    article_type = models.CharField(max_length=30, choices=ARTICLE_TYPE_CHOICES)
    article_type_params = models.JSONField(default=dict)
    param_hash = models.CharField(max_length=64, unique=True, db_index=True)
    generated_article = models.ForeignKey(
        'NewsArticles', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='topic_log',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'article_topic_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_article_type_display()} — {self.article_type_params}"


class Lead(models.Model):
    ENTITY_TYPE_CHOICES = [
        ('startup', 'Стартап'),
        ('franchise', 'Франшиза'),
        ('agency', 'Агентство'),
        ('specialist', 'Специалист'),
    ]
    LEAD_TYPE_CHOICES = [
        ('invest', 'Инвестиция'),
        ('franchise_info', 'Информация о франшизе'),
        ('quote', 'Запрос расчёта'),
        ('consultation', 'Консультация'),
    ]
    STATUS_CHOICES = [
        ('new', 'Новая'),
        ('viewed', 'Просмотрена'),
        ('responded', 'Отвечено'),
        ('converted', 'Конвертирована'),
    ]
    BUDGET_RANGE_CHOICES = [
        ('', 'Не указан'),
        ('до 500К', 'до 500 000 ₽'),
        ('500К-1М', '500 000 — 1 000 000 ₽'),
        ('1М-5М', '1 000 000 — 5 000 000 ₽'),
        ('5М-10М', '5 000 000 — 10 000 000 ₽'),
        ('10М+', 'более 10 000 000 ₽'),
    ]
    EXPERIENCE_CHOICES = [
        ('', 'Не указан'),
        ('none', 'Нет опыта в бизнесе'),
        ('1-3', '1–3 года'),
        ('3+', 'Более 3 лет'),
    ]
    TIMELINE_CHOICES = [
        ('', 'Не указан'),
        ('1m', 'До 1 месяца'),
        ('1-3m', '1–3 месяца'),
        ('3-6m', '3–6 месяцев'),
        ('6m+', 'Более 6 месяцев'),
    ]

    lead_id = models.AutoField(primary_key=True)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.IntegerField()
    user = models.ForeignKey(
        'Users', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='submitted_leads', db_column='user_id',
    )
    entity_owner = models.ForeignKey(
        'Users', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='received_leads', db_column='entity_owner_id',
    )
    lead_type = models.CharField(max_length=20, choices=LEAD_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, default='')
    budget_range = models.CharField(max_length=100, blank=True, default='', choices=BUDGET_RANGE_CHOICES)
    message = models.TextField(blank=True, default='')
    target_city = models.ForeignKey(
        'City', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='leads', db_column='target_city_id',
    )
    business_experience = models.CharField(
        max_length=20, blank=True, default='', choices=EXPERIENCE_CHOICES,
    )
    timeline = models.CharField(
        max_length=20, blank=True, default='', choices=TIMELINE_CHOICES,
    )
    internal_notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'leads'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id'], name='idx_leads_entity'),
            models.Index(fields=['entity_owner', 'status'], name='idx_leads_owner_status'),
        ]

    def __str__(self):
        return f"Lead #{self.lead_id} ({self.get_entity_type_display()}) — {self.name}"

    def get_entity(self):
        """Return the related entity object."""
        model_map = {
            'startup': ('Startups', 'startup_id'),
            'franchise': ('Franchises', 'franchise_id'),
            'agency': ('Agencies', 'agency_id'),
            'specialist': ('Specialists', 'specialist_id'),
        }
        info = model_map.get(self.entity_type)
        if not info:
            return None
        from django.apps import apps
        model = apps.get_model('accounts', info[0])
        return model.objects.filter(pk=self.entity_id).first()

    def get_entity_title(self):
        entity = self.get_entity()
        return entity.title if entity else f"#{self.entity_id}"


class CRMIntegration(models.Model):
    """CRM integration settings per user (Bitrix24, AmoCRM, or generic webhook)."""
    CRM_TYPE_CHOICES = [
        ('bitrix24', 'Bitrix24'),
        ('amocrm', 'AmoCRM'),
        ('webhook', 'Webhook (универсальный)'),
    ]
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        'Users', on_delete=models.CASCADE,
        related_name='crm_integrations', db_column='user_id',
    )
    crm_type = models.CharField(max_length=20, choices=CRM_TYPE_CHOICES)
    webhook_url = models.URLField(max_length=500, help_text="Webhook URL или REST API endpoint")
    api_key = models.CharField(max_length=500, blank=True, default='', help_text="API ключ или токен")
    api_secret = models.CharField(max_length=500, blank=True, default='', help_text="Секретный ключ (для AmoCRM refresh_token)")
    subdomain = models.CharField(max_length=100, blank=True, default='', help_text="Поддомен (для AmoCRM: company.amocrm.ru)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_error = models.TextField(blank=True, default='')
    last_sync_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'crm_integrations'
        unique_together = [('user', 'crm_type')]

    def __str__(self):
        return f"{self.get_crm_type_display()} — {self.user}"


class Franchises(models.Model):
    franchise_id = models.AutoField(primary_key=True)
    owner = models.ForeignKey(
        "Users", models.DO_NOTHING, blank=True, null=True, db_column="owner_id"
    )
    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    direction = models.ForeignKey(
        "Directions", models.DO_NOTHING, blank=True, null=True, db_column="direction_id"
    )
    stage = models.ForeignKey(
        "StartupStages", models.DO_NOTHING, blank=True, null=True, db_column="stage_id"
    )
    investment_size = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True
    )
    payback_period = models.IntegerField(blank=True, null=True)
    own_businesses = models.IntegerField(default=0)
    franchise_businesses = models.IntegerField(default=0)
    own_businesses_count = models.IntegerField(default=0)
    franchise_businesses_count = models.IntegerField(default=0)
    valuation = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True
    )
    pitch_deck_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, default="pending")
    status_id = models.ForeignKey(
        "ReviewStatuses",
        models.DO_NOTHING,
        blank=True,
        null=True,
        db_column="status_id",
        default=3,
    )
    total_invested = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True, default=0
    )
    info_url = models.CharField(max_length=255, blank=True, null=True)
    percent_amount = models.DecimalField(
        max_digits=19, decimal_places=4, blank=True, null=True
    )
    customization_data = models.JSONField(blank=True, null=True)
    total_voters = models.IntegerField(default=0)
    sum_votes = models.IntegerField(default=0)
    is_edited = models.BooleanField(default=False)
    moderator_comment = models.TextField(blank=True, null=True)
    step_number = models.IntegerField(default=1)
    logo_urls = models.JSONField(default=list)
    creatives_urls = models.JSONField(blank=True, null=True, default=list)
    proofs_urls = models.JSONField(blank=True, null=True, default=list)
    video_urls = models.JSONField(blank=True, null=True, default=list)
    planet_image = models.CharField(max_length=50, blank=True, null=True)
    slider_images = models.JSONField(blank=True, null=True, default=list)
    catalog_card_image = models.CharField(max_length=255, blank=True, null=True)
    franchise_cost = models.DecimalField(max_digits=19, decimal_places=4, blank=True, null=True)
    profit_calculation = models.TextField(blank=True, null=True)
    contact_website = models.URLField(max_length=500, blank=True, null=True)
    contact_telegram = models.CharField(max_length=255, blank=True, null=True)
    contact_whatsapp = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = "franchises"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_franchises_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_franchises_owner_status'),
            models.Index(fields=['status', 'direction'], name='idx_franchises_status_dir'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug and self.title:
            from django.utils.text import slugify
            transliterated = NewsArticles._transliterate(self.title)
            base_slug = slugify(transliterated)[:270]
            if not base_slug:
                base_slug = f"franchise-{self.franchise_id or 'new'}"
            slug = base_slug
            counter = 2
            while Franchises.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse("franchise_detail", kwargs={"slug": self.slug or self.franchise_id})

    def get_average_rating(self):
        if self.total_voters > 0:
            return self.sum_votes / self.total_voters
        return 0

    def get_logo_url(self):
        if self.logo_urls and len(self.logo_urls) > 0:
            return self.logo_urls[0]
        return None
    
    def get_catalog_card_image_url(self):
        if self.catalog_card_image:
            return f"{settings.AWS_S3_PUBLIC_BASE_URL}/catalog_cards/{self.catalog_card_image}"
        return None

    def get_investors_count(self):
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'investment_transactions' 
                    AND column_name = 'franchise_id'
                """)
                if not cursor.fetchone():
                    return 0
                cursor.execute("""
                    SELECT COUNT(DISTINCT investor_id) 
                    FROM investment_transactions 
                    WHERE franchise_id = %s
                """, [self.franchise_id])
                result = cursor.fetchone()
                return result[0] if result else 0
        except Exception:
            return 0

    def get_status_display(self):
        status_map = {
            "pending": "На рассмотрении",
            "approved": "Одобрено",
            "rejected": "Отклонено",
        }
        return status_map.get(self.status, self.status)

    def __str__(self):
        return self.title


class City(models.Model):
    """Справочник городов для франшиз и будущих сущностей."""
    REGION_CHOICES = [
        ('central', 'Центральный'),
        ('northwest', 'Северо-Западный'),
        ('south', 'Южный'),
        ('volga', 'Приволжский'),
        ('ural', 'Уральский'),
        ('siberia', 'Сибирский'),
        ('far_east', 'Дальневосточный'),
        ('caucasus', 'Северо-Кавказский'),
    ]
    city_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    region = models.CharField(max_length=50, choices=REGION_CHOICES, blank=True, default='')
    population = models.IntegerField(blank=True, null=True, help_text="Население города")
    is_major = models.BooleanField(default=False, help_text="Город-миллионник")

    class Meta:
        db_table = 'cities'
        ordering = ['name']
        verbose_name_plural = 'Cities'

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            from django.utils.text import slugify
            transliterated = NewsArticles._transliterate(self.name)
            self.slug = slugify(transliterated)[:270] or f"city-{self.pk or 'new'}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class FranchiseLocation(models.Model):
    """Точка присутствия франшизы в конкретном городе."""
    STATUS_CHOICES = [
        ('active', 'Активна'),
        ('planned', 'Планируется'),
        ('closed', 'Закрыта'),
    ]
    location_id = models.AutoField(primary_key=True)
    franchise = models.ForeignKey(
        Franchises, on_delete=models.CASCADE,
        related_name='locations', db_column='franchise_id',
    )
    city = models.ForeignKey(
        City, on_delete=models.CASCADE,
        related_name='franchise_locations', db_column='city_id',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    opened_at = models.DateField(blank=True, null=True, help_text="Дата открытия")
    monthly_revenue = models.DecimalField(
        max_digits=15, decimal_places=2, blank=True, null=True,
        help_text="Средняя месячная выручка (руб)",
    )
    monthly_profit = models.DecimalField(
        max_digits=15, decimal_places=2, blank=True, null=True,
        help_text="Средняя месячная прибыль (руб)",
    )
    initial_investment = models.DecimalField(
        max_digits=15, decimal_places=2, blank=True, null=True,
        help_text="Начальные инвестиции в эту точку (руб)",
    )
    note = models.TextField(blank=True, default='', help_text="Комментарий к точке")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'franchise_locations'
        ordering = ['-opened_at']
        unique_together = [['franchise', 'city']]
        indexes = [
            models.Index(fields=['franchise', 'status'], name='idx_fl_franchise_status'),
            models.Index(fields=['city'], name='idx_fl_city'),
        ]

    def get_payback_months(self):
        """Расчёт окупаемости в месяцах."""
        if self.initial_investment and self.monthly_profit and self.monthly_profit > 0:
            return int(self.initial_investment / self.monthly_profit)
        return None

    def __str__(self):
        return f"{self.franchise.title} — {self.city.name}"


class FranchiseComments(models.Model):
    comment_id = models.AutoField(primary_key=True)
    franchise = models.ForeignKey(
        "Franchises",
        on_delete=models.CASCADE,
        db_column="franchise_id",
        related_name="comments",
    )
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    content = models.TextField()
    user_rating = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="parent_comment_id",
    )

    class Meta:
        managed = True
        db_table = "franchise_comments"
        indexes = [
            models.Index(fields=['franchise', 'parent_comment', '-created_at'], name='idx_frcomments_fran_parent'),
        ]

    def __str__(self) -> str:
        return f"FranchiseComment {self.comment_id} by {self.user}"

class FranchiseCategories(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = True
        db_table = "franchise_categories"

    def __str__(self):
        return self.category_name or "Без названия"


class FranchiseDirections(models.Model):
    direction_id = models.AutoField(primary_key=True)
    direction_name = models.CharField(max_length=255, blank=True, null=True, unique=True)

    class Meta:
        managed = True
        db_table = "franchise_directions"

    def __str__(self):
        return self.direction_name or "Без категории"


class Agencies(models.Model):
    agency_id = models.AutoField(primary_key=True, db_column="agency_id")
    owner = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True, db_column="owner_id")
    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    direction = models.ForeignKey("Directions", models.DO_NOTHING, blank=True, null=True, db_column="direction_id")
    stage = models.ForeignKey("StartupStages", models.DO_NOTHING, blank=True, null=True, db_column="stage_id")
    pitch_deck_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, default="pending")
    customization_data = models.JSONField(blank=True, null=True, default=dict)
    total_voters = models.IntegerField(default=0)
    sum_votes = models.IntegerField(default=0)
    logo_urls = models.JSONField(default=list)
    creatives_urls = models.JSONField(blank=True, null=True, default=list)
    proofs_urls = models.JSONField(blank=True, null=True, default=list)
    video_urls = models.JSONField(blank=True, null=True, default=list)
    planet_image = models.CharField(max_length=50, blank=True, null=True)
    slider_images = models.JSONField(blank=True, null=True, default=list)
    catalog_card_image = models.CharField(max_length=255, blank=True, null=True)
    contact_website = models.URLField(max_length=500, blank=True, null=True)
    contact_telegram = models.CharField(max_length=255, blank=True, null=True)
    contact_whatsapp = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = "agencies"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_agencies_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_agencies_owner_status'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug and self.title:
            from django.utils.text import slugify
            transliterated = NewsArticles._transliterate(self.title)
            base_slug = slugify(transliterated)[:270]
            if not base_slug:
                base_slug = f"agency-{self.agency_id or 'new'}"
            slug = base_slug
            counter = 2
            while Agencies.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse("agency_detail", kwargs={"slug": self.slug or self.agency_id})

    def get_average_rating(self):
        if self.total_voters > 0:
            return self.sum_votes / self.total_voters
        return 0

    def get_catalog_card_image_url(self):
        if self.catalog_card_image:
            return f"{settings.AWS_S3_PUBLIC_BASE_URL}/catalog_cards/{self.catalog_card_image}"
        return None

    def __str__(self):
        return self.title


class Specialists(models.Model):
    specialist_id = models.AutoField(primary_key=True, db_column="specialist_id")
    owner = models.ForeignKey("Users", models.DO_NOTHING, blank=True, null=True, db_column="owner_id")
    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    direction = models.ForeignKey("Directions", models.DO_NOTHING, blank=True, null=True, db_column="direction_id")
    stage = models.ForeignKey("StartupStages", models.DO_NOTHING, blank=True, null=True, db_column="stage_id")
    pitch_deck_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, default="pending")
    customization_data = models.JSONField(blank=True, null=True, default=dict)
    total_voters = models.IntegerField(default=0)
    sum_votes = models.IntegerField(default=0)
    logo_urls = models.JSONField(default=list)
    creatives_urls = models.JSONField(blank=True, null=True, default=list)
    proofs_urls = models.JSONField(blank=True, null=True, default=list)
    video_urls = models.JSONField(blank=True, null=True, default=list)
    planet_image = models.CharField(max_length=50, blank=True, null=True)
    slider_images = models.JSONField(blank=True, null=True, default=list)
    catalog_card_image = models.CharField(max_length=255, blank=True, null=True)
    additional_info = models.TextField(blank=True, null=True)
    contact_website = models.URLField(max_length=500, blank=True, null=True)
    contact_telegram = models.CharField(max_length=255, blank=True, null=True)
    contact_whatsapp = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = "specialists"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_specialists_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_specialists_owner_status'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug and self.title:
            from django.utils.text import slugify
            transliterated = NewsArticles._transliterate(self.title)
            base_slug = slugify(transliterated)[:270]
            if not base_slug:
                base_slug = f"specialist-{self.specialist_id or 'new'}"
            slug = base_slug
            counter = 2
            while Specialists.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse("specialist_detail", kwargs={"slug": self.slug or self.specialist_id})

    def get_average_rating(self):
        if self.total_voters > 0:
            return self.sum_votes / self.total_voters
        return 0

    def get_catalog_card_image_url(self):
        if self.catalog_card_image:
            return f"{settings.AWS_S3_PUBLIC_BASE_URL}/catalog_cards/{self.catalog_card_image}"
        return None

    def __str__(self):
        return self.title


class SpecialistVotes(models.Model):
    vote_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    specialist = models.ForeignKey(
        "Specialists", on_delete=models.CASCADE, db_column="specialist_id", blank=True, null=True, db_constraint=False
    )
    rating = models.IntegerField(db_column="vote_value")
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "specialist_votes"
        unique_together = ("user", "specialist")
        managed = True

    def __str__(self):
        return f"{self.user.email} - {getattr(self.specialist, 'title', '')}: {self.rating}"


class SpecialistComments(models.Model):
    comment_id = models.AutoField(primary_key=True)
    specialist = models.ForeignKey(
        "Specialists",
        on_delete=models.CASCADE,
        db_column="specialist_id",
        related_name="comments",
        db_constraint=False,
    )
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    content = models.TextField()
    user_rating = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="parent_comment_id",
    )

    class Meta:
        managed = True
        db_table = "specialist_comments"
        indexes = [
            models.Index(fields=['specialist', 'parent_comment', '-created_at'], name='idx_spcomments_spec_parent'),
        ]

    def __str__(self) -> str:
        return f"SpecialistComment {self.comment_id} by {self.user}"

class AgencyVotes(models.Model):
    vote_id = models.AutoField(primary_key=True)
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    agency = models.ForeignKey(
        "Agencies", on_delete=models.CASCADE, db_column="agency_id", blank=True, null=True, db_constraint=False
    )
    rating = models.IntegerField(db_column="vote_value")
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "agency_votes"
        unique_together = ("user", "agency")
        managed = True

    def __str__(self):
        return f"{self.user.email} - {getattr(self.agency, 'title', '')}: {self.rating}"


class AgencyComments(models.Model):
    comment_id = models.AutoField(primary_key=True)
    agency = models.ForeignKey(
        "Agencies",
        on_delete=models.CASCADE,
        db_column="agency_id",
        related_name="comments",
        db_constraint=False,
    )
    user = models.ForeignKey("Users", on_delete=models.CASCADE, db_column="user_id")
    content = models.TextField()
    user_rating = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="parent_comment_id",
    )

    class Meta:
        managed = True
        db_table = "agency_comments"
        indexes = [
            models.Index(fields=['agency', 'parent_comment', '-created_at'], name='idx_agcomments_agency_parent'),
        ]

    def __str__(self) -> str:
        return f"AgencyComment {self.comment_id} by {self.user}"


class ModerationLog(models.Model):
    """
    Audit trail для всех действий модераторов.
    Фиксирует: кто, когда, какое действие, над каким объектом.
    """
    ACTION_CHOICES = [
        ("approve", "Одобрено"),
        ("reject", "Отклонено"),
        ("delete_comment", "Комментарий удалён"),
        ("edit", "Отредактировано"),
        ("status_change", "Статус изменён"),
    ]
    ENTITY_CHOICES = [
        ("startup", "Стартап"),
        ("franchise", "Франшиза"),
        ("agency", "Агентство"),
        ("specialist", "Специалист"),
        ("comment", "Комментарий"),
        ("news_article", "Новость"),
    ]

    log_id = models.AutoField(primary_key=True)
    moderator = models.ForeignKey(
        "Users", on_delete=models.SET_NULL, null=True, related_name="moderation_logs"
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=30, choices=ENTITY_CHOICES)
    entity_id = models.IntegerField()
    entity_title = models.CharField(max_length=255, blank=True, default="")
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = "moderation_log"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"], name="idx_modlog_created"),
            models.Index(fields=["moderator", "-created_at"], name="idx_modlog_moderator"),
            models.Index(fields=["entity_type", "entity_id"], name="idx_modlog_entity"),
        ]

    def __str__(self):
        return f"{self.get_action_display()} {self.get_entity_type_display()} #{self.entity_id} — {self.moderator}"


class PinnedCatalogItem(models.Model):
    ENTITY_TYPE_CHOICES = [
        ("startup", "Стартап"),
        ("franchise", "Франшиза"),
        ("agency", "Агентство"),
        ("specialist", "Специалист"),
    ]
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES, verbose_name="Тип")
    entity_id = models.IntegerField(verbose_name="ID сущности")
    position = models.PositiveSmallIntegerField(verbose_name="Позиция (1-6)")
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pinned_catalog_items"
        ordering = ["entity_type", "position"]
        verbose_name = "Закреплённая карточка"
        verbose_name_plural = "Закреплённые карточки"
        constraints = [
            models.UniqueConstraint(fields=["entity_type", "position"], name="uniq_pin_type_pos"),
            models.UniqueConstraint(fields=["entity_type", "entity_id"], name="uniq_pin_type_entity"),
            models.CheckConstraint(check=models.Q(position__gte=1, position__lte=6), name="chk_pin_position_range"),
        ]

    def __str__(self):
        return f"#{self.position} ({self.get_entity_type_display()}) ID={self.entity_id}"

    def get_entity(self):
        model_map = {
            "startup": ("Startups", "startup_id"),
            "franchise": ("Franchises", "franchise_id"),
            "agency": ("Agencies", "agency_id"),
            "specialist": ("Specialists", "specialist_id"),
        }
        info = model_map.get(self.entity_type)
        if not info:
            return None
        model_cls = globals().get(info[0]) or locals().get(info[0])
        if model_cls is None:
            from accounts import models as m
            model_cls = getattr(m, info[0], None)
        if model_cls:
            return model_cls.objects.filter(**{info[1]: self.entity_id}).first()
        return None


class AdPlacement(models.Model):
    ENTITY_TYPE_CHOICES = [
        ("startup", "Стартап"),
        ("franchise", "Франшиза"),
        ("agency", "Агентство"),
        ("specialist", "Специалист"),
    ]
    LOCATION_CHOICES = [
        ("main_under_sidebar", "Главная — под сайдбаром"),
        ("news_sidebar", "Новости — боковая панель"),
        ("cosmochat_banner", "CosmoChat — баннер"),
        ("catalog_sidebar", "Каталог — под фильтрами"),
    ]

    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES, verbose_name="Тип сущности")
    entity_id = models.IntegerField(verbose_name="ID сущности")
    location = models.CharField(max_length=50, choices=LOCATION_CHOICES, verbose_name="Расположение")
    title = models.CharField(max_length=255, blank=True, verbose_name="Заголовок (переопределить)")
    description = models.TextField(blank=True, verbose_name="Описание (переопределить)")
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    start_date = models.DateField(blank=True, null=True, verbose_name="Начало показа")
    end_date = models.DateField(blank=True, null=True, verbose_name="Конец показа")
    sort_order = models.PositiveSmallIntegerField(default=0, verbose_name="Порядок (0 = первый)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ad_placements"
        ordering = ["location", "sort_order"]
        verbose_name = "Рекламное размещение"
        verbose_name_plural = "Рекламные размещения"

    def __str__(self):
        return f"{self.get_location_display()} — {self.get_entity_type_display()} #{self.entity_id}"

    def get_entity(self):
        model_map = {
            "startup": ("Startups", "startup_id"),
            "franchise": ("Franchises", "franchise_id"),
            "agency": ("Agencies", "agency_id"),
            "specialist": ("Specialists", "specialist_id"),
        }
        info = model_map.get(self.entity_type)
        if not info:
            return None
        from accounts import models as m
        model_cls = getattr(m, info[0], None)
        if model_cls:
            return model_cls.objects.filter(**{info[1]: self.entity_id}).first()
        return None


class AnalyticsPageView(models.Model):
    view_id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=20)
    entity_id = models.IntegerField()
    user = models.ForeignKey("Users", models.SET_NULL, blank=True, null=True, db_column="user_id")
    visitor_hash = models.CharField(max_length=64)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    referrer = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "analytics_page_views"


class AnalyticsClickEvent(models.Model):
    click_id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=20)
    entity_id = models.IntegerField()
    button_type = models.CharField(max_length=30)
    user = models.ForeignKey("Users", models.SET_NULL, blank=True, null=True, db_column="user_id")
    visitor_hash = models.CharField(max_length=64)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "analytics_click_events"


class AnalyticsCatalogImpression(models.Model):
    impression_id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=20)
    entity_id = models.IntegerField()
    visitor_hash = models.CharField(max_length=64)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "analytics_catalog_impressions"


class AnalyticsEngagementEvent(models.Model):
    engagement_id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=20)
    entity_id = models.IntegerField()
    visitor_hash = models.CharField(max_length=64)
    time_on_page = models.IntegerField(default=0)
    scroll_depth = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "analytics_engagement_events"


class AnalyticsGeoCache(models.Model):
    ip_address = models.GenericIPAddressField(primary_key=True)
    country_code = models.CharField(max_length=2, blank=True, null=True)
    country_name = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=200, blank=True, null=True)
    resolved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "analytics_geo_cache"


class AnalyticsDailyGeo(models.Model):
    id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=20)
    entity_id = models.IntegerField()
    stat_date = models.DateField()
    country_code = models.CharField(max_length=2)
    country_name = models.CharField(max_length=100, default="")
    view_count = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = "analytics_daily_geo"


class AnalyticsDailyStat(models.Model):
    stat_id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=20)
    entity_id = models.IntegerField()
    stat_date = models.DateField()
    total_views = models.IntegerField(default=0)
    unique_views = models.IntegerField(default=0)
    clicks_contact = models.IntegerField(default=0)
    clicks_website = models.IntegerField(default=0)
    clicks_pitch_deck = models.IntegerField(default=0)
    clicks_telegram = models.IntegerField(default=0)
    clicks_whatsapp = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    unique_impressions = models.IntegerField(default=0)
    avg_time_on_page = models.IntegerField(default=0)
    avg_scroll_depth = models.IntegerField(default=0)
    engagement_count = models.IntegerField(default=0)
    source_direct = models.IntegerField(default=0)
    source_search = models.IntegerField(default=0)
    source_social = models.IntegerField(default=0)
    source_internal = models.IntegerField(default=0)
    source_other = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = "analytics_daily_stats"
        unique_together = (("entity_type", "entity_id", "stat_date"),)


# ── Franchisee Discovery ────────────────────────────────────

class FranchiseAnalysisLog(models.Model):
    """Лог анализа франшизы для поиска контактов франчайзи."""
    STATUS_CHOICES = [
        ('pending', 'В очереди'),
        ('running', 'Выполняется'),
        ('completed', 'Завершено'),
        ('failed', 'Ошибка'),
    ]
    log_id = models.AutoField(primary_key=True)
    franchise = models.ForeignKey(
        'Franchises', on_delete=models.CASCADE,
        related_name='analysis_logs', db_column='franchise_id',
    )
    initiated_by = models.ForeignKey(
        'Users', on_delete=models.SET_NULL, null=True,
        related_name='franchise_analyses', db_column='initiated_by_id',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    celery_task_id = models.CharField(max_length=255, blank=True, default='')
    sources_scraped = models.JSONField(default=list)
    contacts_found = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default='')
    raw_scraped_text = models.TextField(blank=True, default='')
    grok_response_raw = models.TextField(blank=True, default='')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'franchise_analysis_log'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['franchise', '-created_at'], name='idx_falog_franchise'),
            models.Index(fields=['status'], name='idx_falog_status'),
        ]

    def __str__(self):
        return f"Analysis #{self.log_id} — {self.franchise} ({self.status})"


class FranchiseeContact(models.Model):
    """Контакт найденного франчайзи для outreach."""
    OUTREACH_STATUS_CHOICES = [
        ('new', 'Новый'),
        ('to_reach_out', 'Связаться'),
        ('contacted', 'Связались'),
        ('responded', 'Ответил'),
        ('declined', 'Отказ'),
        ('interview_done', 'Интервью проведено'),
    ]
    SOURCE_CHOICES = [
        ('website', 'Сайт франшизы'),
        ('2gis', '2ГИС'),
        ('yandex_maps', 'Яндекс Карты'),
        ('web_search', 'Веб-поиск'),
        ('manual', 'Вручную'),
    ]

    contact_id = models.AutoField(primary_key=True)
    franchise = models.ForeignKey(
        'Franchises', on_delete=models.CASCADE,
        related_name='franchisee_contacts', db_column='franchise_id',
    )
    analysis_log = models.ForeignKey(
        'FranchiseAnalysisLog', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='contacts', db_column='analysis_log_id',
    )
    person_name = models.CharField(max_length=255, blank=True, default='')
    company_name = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(max_length=255, blank=True, default='')
    telegram = models.CharField(max_length=255, blank=True, default='')
    website = models.URLField(max_length=500, blank=True, default='')
    city = models.CharField(max_length=255, blank=True, default='')
    address = models.TextField(blank=True, default='')
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='website')
    source_url = models.URLField(max_length=500, blank=True, default='')
    confidence = models.CharField(max_length=20, blank=True, default='')
    outreach_status = models.CharField(max_length=30, choices=OUTREACH_STATUS_CHOICES, default='new')
    moderator_notes = models.TextField(blank=True, default='')
    assigned_to = models.ForeignKey(
        'Users', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_franchisee_contacts', db_column='assigned_to_id',
    )
    contacted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'franchisee_contacts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['franchise', '-created_at'], name='idx_fcontact_franchise'),
            models.Index(fields=['outreach_status'], name='idx_fcontact_status'),
        ]

    def __str__(self):
        name = self.person_name or self.company_name or self.phone or self.email
        return f"Contact #{self.contact_id} — {name} ({self.franchise})"