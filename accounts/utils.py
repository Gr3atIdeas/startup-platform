import logging
import uuid
from django.utils import timezone
import requests
import re
import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from html import escape
from io import BytesIO
from PIL import Image

logger = logging.getLogger(__name__)


def convert_image_to_webp(uploaded_file, quality=85, max_size=None):
    """
    Конвертирует загруженное изображение в WebP формат для экономии места.
    
    Args:
        uploaded_file: Django UploadedFile или file-like объект
        quality: Качество сжатия (1-100), по умолчанию 85
        max_size: Опциональный кортеж (width, height) для ресайза
    
    Returns:
        tuple: (BytesIO объект с WebP данными, новое имя файла с .webp расширением)
        или (None, None) если конвертация не удалась
    """
    try:
        # Получаем оригинальное имя файла
        original_name = getattr(uploaded_file, 'name', 'image.jpg')
        
        # Проверяем, что это изображение (не видео и не документ)
        content_type = getattr(uploaded_file, 'content_type', '')
        if content_type and not content_type.startswith('image/'):
            logger.debug(f"Пропуск конвертации для не-изображения: {content_type}")
            return None, None
        
        # Проверяем расширение файла
        ext = original_name.lower().split('.')[-1] if '.' in original_name else ''
        image_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'}
        if ext not in image_extensions:
            logger.debug(f"Пропуск конвертации для расширения: {ext}")
            return None, None
        
        # Если уже WebP - оптимизируем без конвертации
        if ext == 'webp':
            logger.debug(f"Файл уже в формате WebP: {original_name}")
            return None, None
        
        # Сбрасываем позицию чтения файла
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
        
        # Открываем изображение
        img = Image.open(uploaded_file)
        original_format = img.format
        original_size = uploaded_file.size if hasattr(uploaded_file, 'size') else 0
        
        # Сохраняем альфа-канал если есть (для PNG с прозрачностью)
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        
        # Изменяем размер если указано
        if max_size:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Сохраняем в WebP
        output = BytesIO()
        img.save(output, 'WEBP', quality=quality, optimize=True)
        output.seek(0)
        
        # Создаём новое имя файла с .webp расширением
        base_name = '.'.join(original_name.split('.')[:-1]) if '.' in original_name else original_name
        new_name = f"{base_name}.webp"
        
        new_size = output.getbuffer().nbytes
        reduction = ((original_size - new_size) / original_size * 100) if original_size > 0 else 0
        
        logger.info(f"Конвертация в WebP: {original_name} -> {new_name}, "
                   f"{original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% экономия)")
        
        return output, new_name
        
    except Exception as e:
        logger.warning(f"Ошибка конвертации в WebP: {e}")
        return None, None


def process_uploaded_image(uploaded_file, quality=85, max_size=None):
    """
    Обрабатывает загруженное изображение: конвертирует в WebP если возможно.
    
    Args:
        uploaded_file: Django UploadedFile
        quality: Качество сжатия WebP
        max_size: Опциональный максимальный размер (width, height)
    
    Returns:
        tuple: (file_object, filename, content_type)
        Возвращает оригинальный файл если конвертация невозможна
    """
    webp_data, webp_name = convert_image_to_webp(uploaded_file, quality, max_size)
    
    if webp_data and webp_name:
        # Создаём file-like объект с нужными атрибутами
        webp_data.name = webp_name
        webp_data.content_type = 'image/webp'
        return webp_data, webp_name, 'image/webp'
    
    # Возвращаем оригинальный файл
    if hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)
    return uploaded_file, getattr(uploaded_file, 'name', 'file'), getattr(uploaded_file, 'content_type', 'application/octet-stream')


def _prefix_for(entity_type: str, entity_id: int, file_type: str) -> str:
    if file_type == "avatar":
        return f"users/{entity_id}/avatar/"
    if file_type == "uploaded_content":
        entity_root = {
            "startup": "startups",
            "franchise": "franchises",
            "agency": "agencies",
            "specialist": "specialists",
        }.get(entity_type or "startup", "startups")
        return f"{entity_root}/{entity_id}/modal_download/"
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
    from django.core.cache import cache
    
    cache_key = f"s3_info:{entity_type}:{entity_id}:{file_type}:{file_id}"
    try:
        cached_info = cache.get(cache_key)
        if cached_info:
            return cached_info
    except Exception as e:
        logger.warning(f"Cache error: {e}")
    
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
            result = {
                'url': url,
                'original_name': original_name
            }
            try:
                cache.set(cache_key, result, 86400)
            except Exception:
                pass
            return result
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
                    result = { 'url': url, 'original_name': original_name }
                    try:
                        cache.set(cache_key, result, 86400)
                    except Exception:
                        pass
                    return result
            logger.warning(f"Файл не найден: prefix={prefix}")
            return None
    except ClientError as e:
        logger.error(f"Ошибка при получении информации о файле: {e}")
        return None
def get_file_url(file_id, entity_id, file_type, entity_type: str = "startup"):
    from django.core.cache import cache
    
    cache_key = f"s3_url:{entity_type}:{entity_id}:{file_type}:{file_id}"
    try:
        cached_url = cache.get(cache_key)
        if cached_url:
            return cached_url
    except Exception as e:
        logger.warning(f"Cache error: {e}")
    
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
            try:
                cache.set(cache_key, url, 86400)
            except Exception:
                pass
            return url
        else:
            if entity_type != "startup" and file_type != "avatar":
                legacy_prefix = f"startups/{entity_id}/{file_type}s/{file_id}_"
                response2 = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=legacy_prefix)
                if "Contents" in response2 and len(response2["Contents"]) > 0:
                    key = response2["Contents"][0]["Key"]

                    url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{key}"
                    try:
                        cache.set(cache_key, url, 86400)
                    except Exception:
                        pass
                    return url
            
            entity_root = {
                "startup": "startups",
                "franchise": "franchises",
                "agency": "agencies",
                "specialist": "specialists",
            }.get(entity_type or "startup", "startups")
            
            if file_type not in ['logo', 'avatar']:
                fallback_prefix = f"{entity_root}/{entity_id}/{file_type}/{file_id}_"
                response3 = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=fallback_prefix)
                if "Contents" in response3 and len(response3["Contents"]) > 0:
                    key = response3["Contents"][0]["Key"]
                    url = f"{settings.AWS_S3_ENDPOINT_URL}/{bucket_name}/{key}"
                    try:
                        cache.set(cache_key, url, 86400)
                    except Exception:
                        pass
                    logger.info(f"Файл найден в fallback пути: {url}")
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

_PLANET_WEBP_RE = re.compile(r'^planet_[1-9]\.webp$')
_PLANET_CHOICES = ['planet_3.webp', 'planet_5.webp', 'planet_6.webp']

def get_planet_image_url(planet_image_filename):
    """Return URL for a planet image. All filenames map to local static textures."""
    if not planet_image_filename:
        return None
    filename = str(planet_image_filename)
    if _PLANET_WEBP_RE.match(filename):
        return f"/static/accounts/images/planetary_system/textures/{filename}"
    # Old filename — deterministic map to one of 3 local textures
    idx = sum(ord(c) for c in filename) % 3
    return f"/static/accounts/images/planetary_system/textures/{_PLANET_CHOICES[idx]}"

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
            # Only show new planet_N.webp textures in the chooser
            if not (filename.startswith("planet_") and filename.endswith(".webp")):
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
    chat_id = getattr(settings, 'TELEGRAM_OWNER_CHAT_ID', '911873673')
    if not bot_token:
        logger.error("Telegram credentials are not configured (TELEGRAM_BOT_TOKEN)")
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
        "🚨 *Новая заявка в техподдержку!* 🚨\n\n"
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
    chat_id = getattr(settings, 'TELEGRAM_OWNER_CHAT_ID', '911873673')
    if not bot_token:
        logger.error("Telegram credentials are not configured (TELEGRAM_BOT_TOKEN)")
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
        "🌐 *Новое сообщение с сайта!* 🌐\n\n"
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


def send_telegram_new_entity_notification(entity_type: str, entity_title: str, owner_name: str, owner_email: str, entity_id: int):
    """
    Sends a notification to Telegram about a new entity submission for moderation.
    
    Args:
        entity_type: Type of entity (startup, franchise, agency, specialist)
        entity_title: Title/name of the entity
        owner_name: Name of the entity owner
        owner_email: Email of the entity owner
        entity_id: ID of the created entity
    """
    from django.conf import settings
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    chat_id = getattr(settings, 'TELEGRAM_OWNER_CHAT_ID', '911873673')

    if not bot_token:
        logger.error("Telegram credentials are not configured (TELEGRAM_BOT_TOKEN)")
        return False

    entity_emojis = {
        'startup': '🚀',
        'franchise': '🏪',
        'agency': '🏢',
        'specialist': '👨‍💼'
    }

    entity_names = {
        'startup': 'Стартап',
        'franchise': 'Франшиза',
        'agency': 'Агентство',
        'specialist': 'Специалист'
    }

    # URL-пути для просмотра сущностей
    entity_url_paths = {
        'startup': 'startups',
        'franchise': 'franchises',
        'agency': 'agencies',
        'specialist': 'specialists',
    }

    emoji = entity_emojis.get(entity_type, '📝')
    entity_name_ru = entity_names.get(entity_type, 'Заявка')

    safe_title = escape_markdown_v2(entity_title or "Без названия")
    safe_owner_name = escape_markdown_v2(owner_name or "Не указан")
    safe_owner_email = escape_markdown_v2(owner_email or "Не указан")

    message_text = (
        f"{emoji} *Новая заявка на модерацию\\!* {emoji}\n\n"
        f"📋 *Тип:* {entity_name_ru}\n"
        f"📝 *Название:* {safe_title}\n"
        f"🆔 *ID:* `{entity_id}`\n\n"
        f"👤 *Автор:* {safe_owner_name}\n"
        f"✉️ *Email:* `{safe_owner_email}`\n\n"
        f"⏰ *Время:* " + timezone.now().strftime("%d\\.%m\\.%Y %H:%M")
    )

    # Inline-кнопки: Одобрить / Отклонить / Посмотреть
    url_path = entity_url_paths.get(entity_type, 'startups')
    view_url = f"https://greatideas.ru/{url_path}/{entity_id}/"

    inline_keyboard = {
        "inline_keyboard": [
            [
                {"text": "✅ Одобрить", "callback_data": f"mod_approve_{entity_type}_{entity_id}"},
                {"text": "❌ Отклонить", "callback_data": f"mod_reject_{entity_type}_{entity_id}"},
            ],
            [
                {"text": "👁 Посмотреть", "url": view_url},
                {"text": "📋 Панель модератора", "url": "https://greatideas.ru/moderator-dashboard/"},
            ],
        ]
    }

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': message_text,
        'parse_mode': 'MarkdownV2',
        'reply_markup': inline_keyboard,
    }

    try:
        logger.info(f"Sending new {entity_type} notification (ID: {entity_id}) to Telegram chat {chat_id}")
        response = requests.post(url, json=payload, timeout=10)
        logger.debug(f"Telegram API response status={response.status_code} body={response.text}")
        response.raise_for_status()

        data = response.json()
        if not data or data.get("ok") is not True:
            desc = (data or {}).get("description", "no description")
            logger.error(f"Telegram returned ok!=True for new entity notification: {desc}")
            raise requests.exceptions.RequestException(desc, response=response)

        logger.info(f"Successfully sent new {entity_type} notification (ID: {entity_id}) to Telegram.")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send new entity notification to Telegram: {e}", exc_info=True)
        try:
            fallback_text = (
                f"{emoji} Новая заявка на модерацию!\n\n"
                f"Тип: {entity_name_ru}\n"
                f"Название: {entity_title or 'Без названия'}\n"
                f"ID: {entity_id}\n\n"
                f"Автор: {owner_name or 'Не указан'}\n"
                f"Email: {owner_email or 'Не указан'}\n\n"
                f"Время: " + timezone.now().strftime("%d.%m.%Y %H:%M")
            )
            fallback_payload = {
                'chat_id': chat_id,
                'text': fallback_text,
                'reply_markup': inline_keyboard,
            }
            fallback_resp = requests.post(url, json=fallback_payload, timeout=10)
            fallback_resp.raise_for_status()
            logger.info(f"Fallback notification send succeeded for {entity_type} (ID: {entity_id})")
            return True
        except requests.exceptions.RequestException as e2:
            logger.error(f"Fallback notification send failed: {e2}", exc_info=True)
            return False
