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
    class Meta:
        managed = True
        db_table = "startups"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_startups_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_startups_owner_status'),
            models.Index(fields=['status', 'direction'], name='idx_startups_status_dir'),
        ]
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
        ("published", "Опубликована"),
        ("archived", "В архиве"),
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
            import uuid
            transliterated = self._transliterate(self.title)
            base_slug = slugify(transliterated)[:250]
            if not base_slug:
                base_slug = "article"
            self.slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
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

    class Meta:
        managed = True
        db_table = "franchises"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_franchises_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_franchises_owner_status'),
            models.Index(fields=['status', 'direction'], name='idx_franchises_status_dir'),
        ]

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

    class Meta:
        managed = True
        db_table = "agencies"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_agencies_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_agencies_owner_status'),
        ]

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

    class Meta:
        managed = True
        db_table = "specialists"
        indexes = [
            models.Index(fields=['status', '-created_at'], name='idx_specialists_status_created'),
            models.Index(fields=['owner', 'status'], name='idx_specialists_owner_status'),
        ]

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