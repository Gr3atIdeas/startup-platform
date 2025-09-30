import logging
import uuid
from django.utils import timezone
import requests
import re
import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from html import escape
logger = logging.getLogger(__name__)
def _prefix_for(entity_type: str, entity_id: int, file_type: str) -> str:
    if file_type == "avatar":
        return f"users/{entity_id}/avatar/"
    entity_root = {
        "startup": "startups",
        "franchise": "franchises",
        "agency": "agencies",
        "specialist": "specialists",
    }.get(entity_type or "startup", "startups")
    return f"{entity_root}/{entity_id}/{file_type}s/"

def get_file_info(file_id, entity_id, file_type, entity_type: str = "startup"):
    """
    Получает URL и оригинальное имя файла из S3.
    Возвращает словарь с 'url' и 'original_name' или None если файл не найден.
    """
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

        prefix = _prefix_for(entity_type, entity_id, file_type) + f"{file_id}_"
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if "Contents" in response and len(response["Contents"]) > 0:
            key = response["Contents"][0]["Key"]

            url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{key}"
            filename = key.split('/')[-1]
            # Пытаемся извлечь оригинальное имя из S3 пути
            # Формат: {file_id}_{safe_name}, где safe_name может быть обработанным
            parts = filename.split('_', 1)
            if len(parts) >= 2:
                # Берем все после первого подчеркивания как потенциальное оригинальное имя
                potential_original = parts[1]
                # Если это не похоже на UUID (слишком короткое или содержит точки), то это оригинальное имя
                if len(potential_original) > 8 or '.' in potential_original:
                    original_name = potential_original
                else:
                    original_name = filename
            else:
                original_name = filename
            logger.debug(f"Найден файл {file_type}: {url}, оригинальное имя: {original_name}")
            return {
                'url': url,
                'original_name': original_name
            }
        else:

            if entity_type != "startup" and file_type != "avatar":
                legacy_prefix = f"startups/{entity_id}/{file_type}s/{file_id}_"
                response2 = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=legacy_prefix)
                if "Contents" in response2 and len(response2["Contents"]) > 0:
                    key = response2["Contents"][0]["Key"]

                    url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{key}"
                    filename = key.split('/')[-1]
                    # Пытаемся извлечь оригинальное имя из S3 пути (legacy)
                    parts = filename.split('_', 1)
                    if len(parts) >= 2:
                        potential_original = parts[1]
                        if len(potential_original) > 8 or '.' in potential_original:
                            original_name = potential_original
                        else:
                            original_name = filename
                    else:
                        original_name = filename
                    return { 'url': url, 'original_name': original_name }
            logger.warning(f"Файл не найден: prefix={prefix}")
            return None
    except ClientError as e:
        logger.error(f"Ошибка при получении информации о файле: {e}")
        return None
def get_file_url(file_id, entity_id, file_type, entity_type: str = "startup"):
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
        prefix = _prefix_for(entity_type, entity_id, file_type) + f"{file_id}_"
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if "Contents" in response and len(response["Contents"]) > 0:
            key = response["Contents"][0]["Key"]

            url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{key}"
            logger.debug(f"Сгенерирован URL для {file_type}: {url}")
            return url
        else:
            if entity_type != "startup" and file_type != "avatar":
                legacy_prefix = f"startups/{entity_id}/{file_type}s/{file_id}_"
                response2 = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=legacy_prefix)
                if "Contents" in response2 and len(response2["Contents"]) > 0:
                    key = response2["Contents"][0]["Key"]

                    url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{key}"
                    return url
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
        planets = []
        for obj in response["Contents"]:
            key = obj.get("Key")
            if not key or key == prefix:
                continue
            filename = key.split("/")[-1]
            stem = filename.rsplit(".", 1)[0].lower()
            if stem == "0" or "plus" in stem:
                continue
            planets.append(filename)
        return planets
    except ClientError as e:
        logger.error(f"Error listing planets: {e}")
        return []
def update_user_from_telegram(user, sociallogin):
    """
    Forcefully updates a user model instance with data from a Telegram social login account.
    This function compares fields and saves the user only if there are changes.
    First name and last name are intentionally NOT updated to allow user customization.
    """
    if not sociallogin or sociallogin.account.provider != 'telegram':
        return
    try:
        telegram_data = sociallogin.account.extra_data
        update_fields = []
        tg_id = str(telegram_data.get('id'))
        tg_username = telegram_data.get('username')
        tg_photo_url = telegram_data.get('photo_url')
        if not tg_photo_url:
            try:
                bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
                if bot_token and tg_id:
                    resp = requests.get(
                        f"https://api.telegram.org/bot{bot_token}/getUserProfilePhotos",
                        params={"user_id": tg_id, "limit": 1},
                        timeout=5,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    photos = (data or {}).get("result", {}).get("photos", [])
                    if photos:
                        sizes = photos[0]
                        file_id = sizes[-1].get("file_id") if sizes else None
                        if file_id:
                            f_resp = requests.get(
                                f"https://api.telegram.org/bot{bot_token}/getFile",
                                params={"file_id": file_id},
                                timeout=5,
                            )
                            f_resp.raise_for_status()
                            f_data = f_resp.json()
                            file_path = (f_data or {}).get("result", {}).get("file_path")
                            if file_path:
                                tg_photo_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
                                logger.info(f"Fetched Telegram avatar file_path={file_path} for user_id={tg_id}")
            except Exception as e:
                logger.warning(f"Fallback fetch of Telegram avatar failed for user_id={tg_id}: {e}")
        if user.telegram_id != tg_id:
            user.telegram_id = tg_id
            update_fields.append('telegram_id')
        if tg_username and user.username != tg_username:
            user.username = tg_username
            update_fields.append('username')
        if tg_photo_url and user.profile_picture_url != tg_photo_url:
            user.profile_picture_url = tg_photo_url
            update_fields.append('profile_picture_url')
        if tg_username:
            telegram_handle = f"@{tg_username}"
            if not isinstance(user.social_links, dict) or user.social_links.get('telegram') != telegram_handle:
                if not isinstance(user.social_links, dict):
                    user.social_links = {}
                user.social_links['telegram'] = telegram_handle
                update_fields.append('social_links')
        if update_fields:
            user.updated_at = timezone.now()
            update_fields.append('updated_at')
            user.save(update_fields=update_fields)
            logger.info(f"User {user.username} (ID: {user.pk}) has been updated from Telegram. Fields changed: {update_fields}")
    except Exception as e:
        logger.error(f"CRITICAL ERROR in update_user_from_telegram for user {user.pk}: {e}", exc_info=True)
def escape_markdown_v2(text: str) -> str:
    """Escapes characters for Telegram's MarkdownV2 parse mode."""
    if not text:
        return ''
    escape_chars = r'_*[]()~`>#+-=|{}.!'
    return re.sub(f'([{re.escape(escape_chars)}])', r'\\\1', text)


def send_telegram_support_message(ticket):
    """
    Sends a formatted support ticket message with an inline button to a specific Telegram chat.
    Uses HTML parse mode for robust formatting.
    """
    from django.conf import settings
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    chat_id = getattr(settings, 'TELEGRAM_OWNER_CHAT_ID', None)
    if not bot_token or not chat_id:
        logger.error("Telegram credentials are not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_OWNER_CHAT_ID)")
        return False

    user = ticket.user
    if not user:
        user_full_name = "Анонимный"
        email = "Не указан"
        telegram_handle = "Не указан"
    else:
        user_full_name = (f"{user.first_name or ''} {user.last_name or ''}".strip()) or "Имя не указано"
        email = user.email or "Не указан"
        telegram_handle = user.social_links.get('telegram', 'Не указан') if isinstance(user.social_links, dict) else 'Не указан'

    safe_subject = escape_markdown_v2(ticket.subject or "")
    safe_message = escape_markdown_v2(ticket.message or "")
    safe_user_full_name = escape_markdown_v2(user_full_name)
    safe_email = escape_markdown_v2(email)
    safe_tg = escape_markdown_v2(telegram_handle)

    message_text = (
        "🚨 *Новая заявка в техподдержку\!* 🚨\n\n"
        f"📝 *Тема:* {safe_subject}\n\n"
        f"📄 *Сообщение:*\n{safe_message}\n\n"
        f"— Техническая информация —\n"
        f"👤 *Пользователь:* {safe_user_full_name}\n"
        f"🆔 *ID на платформе:* `{ticket.user.user_id if user else 'N/A'}`\n"
        f"✉️ *Email:* `{safe_email}`\n"
        f"✈️ *Telegram:* `{safe_tg}`"
    )

    inline_keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Исполнено", "callback_data": f"close_ticket_{ticket.ticket_id}"}
        ]]
    }

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': message_text,
        'parse_mode': 'MarkdownV2',
        'reply_markup': inline_keyboard
    }

    try:
        logger.info(f"Sending support ticket {ticket.ticket_id} to Telegram chat {chat_id}")
        response = requests.post(url, json=payload, timeout=10)
        status_code = response.status_code
        text = response.text
        logger.debug(f"Telegram API response status={status_code} body={text}")
        response.raise_for_status()
        try:
            data = response.json()
        except ValueError:
            data = None
        if not data or data.get("ok") is not True:
            desc = (data or {}).get("description", "no description")
            logger.error(f"Telegram returned ok!=True for ticket {ticket.ticket_id}: {desc}")
            raise requests.exceptions.RequestException(desc, response=response)
        logger.info(f"Successfully sent support ticket {ticket.ticket_id} to Telegram chat {chat_id}.")
        return True
    except requests.exceptions.RequestException as e:
        resp_text = getattr(e.response, 'text', '') if hasattr(e, 'response') else ''
        logger.error(f"Failed to send support ticket {ticket.ticket_id} to Telegram: {e}. Response: {resp_text}", exc_info=True)
        try:
            fallback_text = (
                f"Новая заявка #{ticket.ticket_id}\n\n"
                f"Тема: {ticket.subject or ''}\n\n"
                f"Сообщение:\n{ticket.message or ''}\n\n"
                f"Пользователь: {user_full_name if user else 'Анонимный'}"
            )
            fallback_payload = {
                'chat_id': chat_id,
                'text': fallback_text,
            }
            fallback_resp = requests.post(url, json=fallback_payload, timeout=10)
            logger.debug(f"Telegram fallback response status={fallback_resp.status_code} body={fallback_resp.text}")
            fallback_resp.raise_for_status()
            logger.info(f"Fallback send succeeded for ticket {ticket.ticket_id}")
            return True
        except requests.exceptions.RequestException as e2:
            logger.error(f"Fallback send failed for ticket {ticket.ticket_id}: {e2}", exc_info=True)
            return False


def send_telegram_contact_form_message(name, email, subject, message):
    """
    Sends a formatted contact form message to the same Telegram chat.
    Uses HTML parse mode for robust formatting.
    """
    from django.conf import settings
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    chat_id = getattr(settings, 'TELEGRAM_OWNER_CHAT_ID', None)
    if not bot_token or not chat_id:
        logger.error("Telegram credentials are not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_OWNER_CHAT_ID)")
        return False

    safe_name = escape_markdown_v2(name or "")
    safe_email = escape_markdown_v2(email or "")
    safe_subject = escape_markdown_v2(subject or "")
    safe_message = escape_markdown_v2(message or "")


    subject_translations = {
        'general_inquiry': 'Общий вопрос',
        'business_cooperation': 'Бизнес-сотрудничество',
        'technical_support': 'Техническая поддержка',
        'partnership': 'Партнерство',
        'investment': 'Инвестиции',
        'other': 'Другое'
    }

    translated_subject = subject_translations.get(safe_subject.lower(), safe_subject)

    message_text = (
        "🌐 *Новое сообщение с сайта\!* 🌐\n\n"
        f"👤 *Имя:* {safe_name}\n"
        f"✉️ *Email:* `{safe_email}`\n"
        f"📝 *Тема:* {translated_subject}\n\n"
        f"📄 *Сообщение:*\n{safe_message}\n\n"
        f"— Информация —\n"
        f"🌐 *Источник:* Страница контактов\n"
        f"⏰ *Время:* " + timezone.now().strftime("%d.%m.%Y %H:%M") + "\n"
        f"🔗 *Ссылка:* [greatideas\\.ru/contacts](https://greatideas\\.ru/contacts)"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': message_text,
        'parse_mode': 'MarkdownV2'
    }

    try:
        logger.info(f"Sending contact form message from {email} to Telegram chat {chat_id}")
        response = requests.post(url, json=payload, timeout=10)
        status_code = response.status_code
        text = response.text
        logger.debug(f"Telegram API response status={status_code} body={text}")
        response.raise_for_status()
        try:
            data = response.json()
        except ValueError:
            data = None
        if not data or data.get("ok") is not True:
            desc = (data or {}).get("description", "no description")
            logger.error(f"Telegram returned ok!=True for contact form from {email}: {desc}")
            raise requests.exceptions.RequestException(desc, response=response)
        logger.info(f"Successfully sent contact form message from {email} to Telegram chat {chat_id}.")
        return True
    except requests.exceptions.RequestException as e:
        resp_text = getattr(e.response, 'text', '') if hasattr(e, 'response') else ''
        logger.error(f"Failed to send contact form message from {email} to Telegram: {e}. Response: {resp_text}", exc_info=True)
        try:

            subject_translations = {
                'general_inquiry': 'Общий вопрос',
                'business_cooperation': 'Бизнес-сотрудничество',
                'technical_support': 'Техническая поддержка',
                'partnership': 'Партнерство',
                'investment': 'Инвестиции',
                'other': 'Другое'
            }

            translated_subject = subject_translations.get((subject or '').lower(), subject or '')

            fallback_text = (
                f"🌐 Новое сообщение с сайта\n\n"
                f"Имя: {name or ''}\n"
                f"Email: {email or ''}\n"
                f"Тема: {translated_subject}\n\n"
                f"Сообщение:\n{message or ''}\n\n"
                f"Источник: Страница контактов\n"
                f"Время: " + timezone.now().strftime("%d.%m.%Y %H:%M")
            )
            fallback_payload = {
                'chat_id': chat_id,
                'text': fallback_text,
            }
            fallback_resp = requests.post(url, json=fallback_payload, timeout=10)
            logger.debug(f"Telegram fallback response status={fallback_resp.status_code} body={fallback_resp.text}")
            fallback_resp.raise_for_status()
            logger.info(f"Fallback send succeeded for contact form from {email}")
            return True
        except requests.exceptions.RequestException as e2:
            logger.error(f"Fallback send failed for contact form from {email}: {e2}", exc_info=True)
            return False
