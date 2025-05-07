# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.utils.text import slugify
from django.db.models import JSONField  # Новый импорт для JSONField
import os
import logging

logger = logging.getLogger(__name__)

# Связанные модели
class Actions(models.Model):
    action_id = models.AutoField(primary_key=True)
    action_name = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'actions'

class ActivityLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    action = models.ForeignKey(Actions, models.DO_NOTHING, blank=True, null=True)
    details = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'activity_log'

def creative_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    base_name = slugify(os.path.splitext(filename)[0])[:50]
    new_filename = f"creative_{instance.entity_id}_{base_name}{ext}"
    return f'startups/{instance.entity_id}/creatives/{new_filename}'

def proof_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    base_name = slugify(os.path.splitext(filename)[0])[:50]
    new_filename = f"proof_{instance.entity_id}_{base_name}{ext}"
    return f'startups/{instance.entity_id}/proofs/{new_filename}'

def video_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    base_name = slugify(os.path.splitext(filename)[0])[:50]
    new_filename = f"video_{instance.entity_id}_{base_name}{ext}"
    return f'startups/{instance.entity_id}/videos/{new_filename}'

class ChatConversations(models.Model):
    conversation_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'chat_conversations'

class ChatParticipants(models.Model):
    participant_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(ChatConversations, models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'chat_participants'

class Comments(models.Model):
    comment_id = models.AutoField(primary_key=True)
    startup_id = models.ForeignKey('Startups', on_delete=models.CASCADE, db_column='startup_id', related_name='comments')
    user_id = models.ForeignKey('Users', on_delete=models.CASCADE, db_column='user_id')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent_comment_id = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, db_column='parent_comment_id')

    class Meta:
        managed = False
        db_table = 'comments'

    def __str__(self):
        return f"Comment {self.comment_id} by {self.user_id}"

class Directions(models.Model):
    direction_id = models.AutoField(primary_key=True)
    direction_name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        name = self.direction_name or "Не указано"
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='replace')
        return name

    class Meta:
        managed = False
        db_table = 'directions'

class EntityTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'entity_types'

class FileStorage(models.Model):
    file_id = models.AutoField(primary_key=True)
    entity_type = models.ForeignKey(EntityTypes, models.DO_NOTHING, blank=True, null=True)
    entity_id = models.IntegerField(blank=True, null=True)
    file_url = models.CharField(max_length=1000, blank=True, null=True)  # Изменяем на CharField
    file_type = models.ForeignKey('FileTypes', models.DO_NOTHING, blank=True, null=True)
    uploaded_at = models.DateTimeField(blank=True, null=True)
    startup = models.ForeignKey('Startups', models.CASCADE, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'file_storage'

class FileTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'file_types'

class InvestmentTransactions(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey('Startups', models.DO_NOTHING, blank=True, null=True)
    investor = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    amount = models.DecimalField(max_digits=19, decimal_places=4)
    is_micro = models.BooleanField(blank=True, null=True)
    transaction_type = models.ForeignKey('TransactionTypes', models.DO_NOTHING, blank=True, null=True)
    payment_gateway_response = models.JSONField(blank=True, null=True)
    transaction_status = models.CharField(max_length=50, blank=True, null=True)
    payment_method = models.ForeignKey('PaymentMethods', models.DO_NOTHING, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'investment_transactions'

class LegalPages(models.Model):
    page_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    version = models.CharField(max_length=50, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'legal_pages'

class MessageStatuses(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'message_statuses'

class Messages(models.Model):
    message_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(ChatConversations, models.DO_NOTHING, blank=True, null=True)
    sender = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    message_text = models.TextField()
    status = models.ForeignKey(MessageStatuses, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'messages'

class NewsArticles(models.Model):
    article_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'news_articles'

class NotificationTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'notification_types'

class Notifications(models.Model):
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    type = models.ForeignKey(NotificationTypes, models.DO_NOTHING, blank=True, null=True)
    message = models.TextField()
    is_read = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'notifications'

class PaymentMethods(models.Model):
    method_id = models.AutoField(primary_key=True)
    method_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'payment_methods'

class PlanetCustomizations(models.Model):
    customization_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey('Startups', models.DO_NOTHING, blank=True, null=True)
    top_part = models.CharField(max_length=100, blank=True, null=True)
    middle_part = models.CharField(max_length=100, blank=True, null=True)
    bottom_part = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'planet_customizations'

class Roles(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(unique=True, max_length=50)

    def __str__(self):
        return self.role_name

    class Meta:
        managed = False
        db_table = 'roles'

class StartupStages(models.Model):
    stage_id = models.AutoField(primary_key=True)
    stage_name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        name = self.stage_name or "Не указано"
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='replace')
        return name

    class Meta:
        managed = False
        db_table = 'startup_stages'

class StartupTimeline(models.Model):
    event_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey('Startups', models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    event_date = models.DateTimeField(blank=True, null=True)
    step_number = models.IntegerField(default=1)  # Добавляем поле step_number

    class Meta:
        managed = False
        db_table = 'startup_timeline'

class StartupVotes(models.Model):
    vote_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey('Startups', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    vote_value = models.ForeignKey('VoteTypes', models.DO_NOTHING, db_column='vote_value', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'startup_votes'
        unique_together = (('user', 'startup'),)

class UserVotes(models.Model):
    vote_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', on_delete=models.CASCADE, db_column='user_id')
    startup = models.ForeignKey('Startups', on_delete=models.CASCADE, db_column='startup_id')
    rating = models.IntegerField(db_column='vote_value')
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'startup_votes'
        unique_together = ('user', 'startup')
        managed = False

    def __str__(self):
        return f"{self.user.email} - {self.startup.title}: {self.rating}"

class Subscriptions(models.Model):
    subscription_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    plan_name = models.CharField(max_length=100)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    payment_method = models.ForeignKey(PaymentMethods, models.DO_NOTHING, blank=True, null=True)
    amount = models.DecimalField(max_digits=19, decimal_places=4)
    renewal_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'subscriptions'

class TransactionTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'transaction_types'

class UserInterests(models.Model):
    interest_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    startup = models.ForeignKey('Startups', models.DO_NOTHING, blank=True, null=True)
    interest_type = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user_interests'
        unique_together = (('user', 'startup', 'interest_type'),)

class UserSettings(models.Model):
    setting_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    setting_key = models.CharField(max_length=100)
    setting_value = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'user_settings'

class UserStatuses(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'user_statuses'

class VoteTypes(models.Model):
    type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'vote_types'

class ReviewStatuses(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'review_statuses'

    def __str__(self):
        return self.status_name

# accounts/models.py
class Startups(models.Model):
    startup_id = models.AutoField(primary_key=True)
    owner = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True, db_column='owner_id')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    direction = models.ForeignKey('Directions', models.DO_NOTHING, blank=True, null=True, db_column='direction_id')
    stage = models.ForeignKey('StartupStages', models.DO_NOTHING, blank=True, null=True, db_column='stage_id')
    funding_goal = models.DecimalField(max_digits=19, decimal_places=4, blank=True, null=True)
    amount_raised = models.DecimalField(max_digits=19, decimal_places=4, blank=True, null=True)
    valuation = models.DecimalField(max_digits=19, decimal_places=4, blank=True, null=True)
    pitch_deck_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    planet_top_color = models.CharField(max_length=7, default='#FFFFFF')
    planet_middle_color = models.CharField(max_length=7, default='#FFFFFF')
    planet_bottom_color = models.CharField(max_length=7, default='#FFFFFF')
    status = models.CharField(max_length=20, default='pending')
    status_id = models.ForeignKey(ReviewStatuses, models.DO_NOTHING, blank=True, null=True, db_column='status_id', default=3)
    only_invest = models.BooleanField(default=False)
    only_buy = models.BooleanField(default=False)
    both_mode = models.BooleanField(default=False)
    total_invested = models.DecimalField(max_digits=19, decimal_places=4, blank=True, null=True, default=0)
    info_url = models.CharField(max_length=255, blank=True, null=True)
    percent_amount = models.DecimalField(max_digits=19, decimal_places=4, blank=True, null=True)
    customization_data = models.JSONField(blank=True, null=True)
    micro_investment_available = models.BooleanField(default=False)
    total_voters = models.IntegerField(default=0)
    sum_votes = models.IntegerField(default=0)
    is_edited = models.BooleanField(default=False)
    moderator_comment = models.TextField(blank=True, null=True)
    for_sale = models.BooleanField(default=False)
    step_number = models.IntegerField(default=1)
    logo_urls = JSONField(default=list)
    creatives_urls = JSONField(blank=True, null=True, default=list)
    proofs_urls = JSONField(blank=True, null=True, default=list)
    video_urls = JSONField(blank=True, null=True, default=list)

    class Meta:
        managed = False
        db_table = 'startups'

    def get_average_rating(self):
        """Вычисляет средний рейтинг на основе sum_votes и total_voters."""
        if self.total_voters > 0:
            return float(self.sum_votes) / self.total_voters
        return 0.0

    def get_logo_url(self):
        """Генерирует URL первого логотипа из logo_urls."""
        if self.logo_urls and isinstance(self.logo_urls, list) and len(self.logo_urls) > 0 and self.logo_urls[0]:
            try:
                from django.core.files.storage import default_storage
                logo_url = default_storage.url(f"startups/{self.startup_id}/logos/{self.logo_urls[0]}_")
                logger.info(f"Сгенерирован URL для логотипа стартапа {self.startup_id}: {logo_url}")
                return logo_url
            except Exception as e:
                logger.error(f"Ошибка при генерации URL для логотипа стартапа {self.startup_id}: {str(e)}")
        return None
    
    def get_investors_count(self):
        """Подсчитывает количество уникальных инвесторов для стартапа."""
        return InvestmentTransactions.objects.filter(
            startup=self,
            transaction_status='completed'
        ).values('investor_id').distinct().count()

    def get_progress_percentage(self):
        if self.funding_goal and self.funding_goal > 0:
            amount_raised = self.amount_raised or 0
            try:
                percentage = (amount_raised / self.funding_goal) * 100
                # Ограничиваем от 0 до 100 и ОКРУГЛЯЕМ до ближайшего целого
                capped_percentage = min(max(percentage, 0), 100)
                return round(capped_percentage)
            except (TypeError, ZeroDivisionError, ValueError):
                # Добавил ValueError на случай проблем с Decimal->float в round, хотя не должно
                return 0 
        return 0

class ModeratorReviews(models.Model):
    review_id = models.AutoField(primary_key=True)
    startup = models.ForeignKey(Startups, models.DO_NOTHING, blank=True, null=True)
    moderator = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    review_status = models.ForeignKey(ReviewStatuses, models.DO_NOTHING, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'moderator_reviews'

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, first_name=None, last_name=None, phone=None, role_id=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role_id=role_id,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

class Users(AbstractBaseUser):
    user_id = models.AutoField(primary_key=True)
    email = models.CharField(unique=True, max_length=255)
    password_hash = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.ForeignKey('Roles', models.SET_NULL, blank=True, null=True, db_column='role_id')
    profile_picture_url = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    rating = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    status = models.ForeignKey('UserStatuses', models.SET_DEFAULT, default=1, blank=True, null=True, db_column='status_id')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

    def set_password(self, raw_password):
        if raw_password is None:
            self.password_hash = None
        else:
            self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

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
    
class NewsArticles(models.Model):
    article_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    image_url = models.CharField(max_length=1000, blank=True, null=True)  # Поле для URL картинки
    tags = models.CharField(max_length=255, blank=True, null=True)  # Поле для тегов (например, "Администрация")

    class Meta:
        managed = False
        db_table = 'news_articles'

    def get_image_url(self):
        """Генерирует полный URL для картинки новости."""
        if self.image_url:
            # Базовый URL Yandex Object Storage
            base_url = "https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/"
            return f"{base_url}{self.image_url}"
        return None

class NewsLikes(models.Model):
    like_id = models.AutoField(primary_key=True)
    article = models.ForeignKey('NewsArticles', models.CASCADE, db_column='article_id')
    user = models.ForeignKey('Users', models.CASCADE, db_column='user_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'news_likes'
        unique_together = (('article', 'user'),)

class NewsViews(models.Model):
    view_id = models.AutoField(primary_key=True)
    article = models.ForeignKey('NewsArticles', models.CASCADE, db_column='article_id')
    user = models.ForeignKey('Users', models.CASCADE, db_column='user_id', null=True, blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'news_views'

class ChatConversations(models.Model):
    conversation_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'chat_conversations'

    def get_participants(self):
        """Возвращает список участников чата."""
        return self.chatparticipants_set.all()

    def get_last_message(self):
        """Возвращает последнее сообщение в чате."""
        return self.messages_set.order_by('-created_at').first()

class ChatParticipants(models.Model):
    participant_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(ChatConversations, models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'chat_participants'

class Messages(models.Model):
    message_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(ChatConversations, models.DO_NOTHING, blank=True, null=True)
    sender = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    message_text = models.TextField()
    status = models.ForeignKey(MessageStatuses, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'messages'

    def is_read(self):
        """Проверяет, прочитано ли сообщение."""
        return self.status.status_name == 'read'