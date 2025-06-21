# accounts/utils.py
import logging
import uuid
from django.utils import timezone

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


def get_file_url(file_id, entity_id, file_type):
    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    if file_type == "avatar":
        prefix = f"users/{entity_id}/avatar/{file_id}_"
    else:
        prefix = f"startups/{entity_id}/{file_type}s/{file_id}_"
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if "Contents" in response and len(response["Contents"]) > 0:
            key = response["Contents"][0]["Key"]
            url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{key}"
            logger.debug(f"Сгенерирован URL для {file_type}: {url}")
            return url
        else:
            logger.warning(f"Файл не найден: prefix={prefix}")
            return None
    except ClientError as e:
        logger.error(f"Ошибка при генерации URL: {e}")
        return None


def is_uuid(value):
    """
    Проверяет, является ли строка UUID.
    """
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


def get_planet_urls():
    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    prefix = "choosable_planets/"
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if "Contents" not in response:
            logger.warning(f"No files found in {prefix}")
            return []
        planets = [
            obj["Key"].split("/")[-1]
            for obj in response["Contents"]
            if obj["Key"] != prefix
        ]
        return planets
    except ClientError as e:
        logger.error(f"Error listing planets: {e}")
        return []


def update_user_from_telegram(user, sociallogin):
    """
    Forcefully updates a user model instance with data from a Telegram social login account.
    This function compares fields and saves the user only if there are changes.
    """
    if not sociallogin or sociallogin.account.provider != 'telegram':
        return

    try:
        telegram_data = sociallogin.account.extra_data
        update_fields = []

        # --- Data from Telegram ---
        tg_id = str(telegram_data.get('id'))
        tg_username = telegram_data.get('username')
        tg_first_name = telegram_data.get('first_name')
        tg_last_name = telegram_data.get('last_name', '')
        tg_photo_url = telegram_data.get('photo_url')

        # --- Compare and stage fields for update ---
        if user.telegram_id != tg_id:
            user.telegram_id = tg_id
            update_fields.append('telegram_id')

        if tg_username and user.username != tg_username:
            user.username = tg_username
            update_fields.append('username')

        if tg_first_name and user.first_name != tg_first_name:
            user.first_name = tg_first_name
            update_fields.append('first_name')

        if user.last_name != tg_last_name:
            user.last_name = tg_last_name
            update_fields.append('last_name')

        if tg_photo_url and user.profile_picture_url != tg_photo_url:
            user.profile_picture_url = tg_photo_url
            update_fields.append('profile_picture_url')
        
        # --- Handle JSONB social_links field ---
        if tg_username:
            telegram_link = f"https://t.me/{tg_username}"
            if not isinstance(user.social_links, dict) or user.social_links.get('telegram') != telegram_link:
                if not isinstance(user.social_links, dict):
                    user.social_links = {}
                user.social_links['telegram'] = telegram_link
                update_fields.append('social_links')

        # --- Save if any fields were updated ---
        if update_fields:
            user.updated_at = timezone.now()
            update_fields.append('updated_at')
            
            user.save(update_fields=update_fields)
            logger.info(f"User {user.username} (ID: {user.pk}) has been updated from Telegram. Fields changed: {update_fields}")

    except Exception as e:
        logger.error(f"CRITICAL ERROR in update_user_from_telegram for user {user.pk}: {e}", exc_info=True)
