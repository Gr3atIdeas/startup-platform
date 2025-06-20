from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver
from .models import Users
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@receiver(social_account_added)
def handle_telegram_login(request, sociallogin, **kwargs):
    telegram_data = sociallogin.account.extra_data
    
    # Логируем полученные данные
    logger.info(f"Telegram login data: {telegram_data}")

    # Сохранение данных в таблицу users
    users_entry, created = Users.objects.get_or_create(
        telegram_id=telegram_data['id'],
        defaults={
            'telegram_email': f"{telegram_data['id']}@telegram.com",
            'social_links': {'telegram': telegram_data.get('username', '')},
            'first_name': telegram_data.get('first_name', ''),
            'last_name': telegram_data.get('last_name', ''),
            'profile_picture_url': telegram_data.get('photo_url', ''),
            'role_id': 1,  # Укажите нужный role_id (например, "startuper")
            'is_active': True,
            'created_at': timezone.now(),
            'updated_at': timezone.now(),
            'last_login': timezone.now(),
        }
    )
    if not created:
        # Обновление существующих данных
        users_entry.telegram_email = f"{telegram_data['id']}@telegram.com"
        users_entry.social_links = {
            'telegram': telegram_data.get('username', users_entry.social_links.get('telegram', ''))
        }
        users_entry.first_name = telegram_data.get('first_name', users_entry.first_name)
        users_entry.last_name = telegram_data.get('last_name', users_entry.last_name)
        users_entry.profile_picture_url = telegram_data.get('photo_url', users_entry.profile_picture_url)
        users_entry.last_login = timezone.now()
        users_entry.save()

    # Связываем sociallogin с пользователем
    sociallogin.connect(request, users_entry)

    logger.info(f"Telegram user processed: user_id={users_entry.user_id}, telegram_id={users_entry.telegram_id}")