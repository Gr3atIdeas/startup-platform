import logging
import uuid
import base64
from urllib.parse import urlparse
from celery import shared_task
from django.conf import settings
from django.utils import timezone
import boto3
from .models import FileStorage, FileTypes, EntityTypes, Startups
from PIL import Image
from io import BytesIO

import psycopg2

logger = logging.getLogger(__name__)


# ── Entity notification templates ──────────────────────────────────────────

_ENTITY_TEMPLATES = {
    "startup": (
        "На платформе GreatIdeas опубликован новый стартап:\n\n"
        "<b>{title}</b>\n\n"
        "{short_description}\n\n"
        "Направление: {direction}\n"
        "Стадия: {stage}\n\n"
        "Подробнее: https://www.greatideas.ru/startups/{id}/"
    ),
    "franchise": (
        "На платформе GreatIdeas опубликована новая франшиза:\n\n"
        "<b>{title}</b>\n\n"
        "{short_description}\n\n"
        "Направление: {direction}\n"
        "Стадия: {stage}\n\n"
        "Подробнее: https://www.greatideas.ru/franchises/{id}/"
    ),
    "agency": (
        "На платформе GreatIdeas опубликовано новое агентство:\n\n"
        "<b>{title}</b>\n\n"
        "{short_description}\n\n"
        "Направление: {direction}\n\n"
        "Подробнее: https://www.greatideas.ru/agencies/{id}/"
    ),
    "specialist": (
        "На платформе GreatIdeas опубликован новый специалист:\n\n"
        "<b>{title}</b>\n\n"
        "{short_description}\n\n"
        "Направление: {direction}\n\n"
        "Подробнее: https://www.greatideas.ru/specialists/{id}/"
    ),
}

_ENTITY_MODELS = {
    "startup": ("Startups", "startup_id"),
    "franchise": ("Franchises", "franchise_id"),
    "agency": ("Agencies", "agency_id"),
    "specialist": ("Specialists", "specialist_id"),
}

_TABLE_PREFIX = "news_"


def _parse_database_url(url: str) -> dict:
    """Parse DATABASE_URL into psycopg2 connect kwargs."""
    parsed = urlparse(url)
    return {
        "host": parsed.hostname,
        "port": parsed.port or 5432,
        "dbname": parsed.path.lstrip("/"),
        "user": parsed.username,
        "password": parsed.password,
    }


@shared_task(bind=True, max_retries=3)
def notify_entity_approved(self, entity_type: str, entity_id: int):
    """Generate announcement text and insert into news_moderation_queue for the bot."""
    try:
        if entity_type not in _ENTITY_MODELS:
            logger.error("Unknown entity_type: %s", entity_type)
            return

        model_name, pk_field = _ENTITY_MODELS[entity_type]

        from .models import Startups, Franchises, Agencies, Specialists
        model_map = {
            "Startups": Startups,
            "Franchises": Franchises,
            "Agencies": Agencies,
            "Specialists": Specialists,
        }
        model = model_map[model_name]
        entity = model.objects.filter(pk=entity_id).first()
        if not entity:
            logger.error("Entity %s id=%d not found", entity_type, entity_id)
            return

        # Connect to shared PostgreSQL (same DATABASE_URL as news_collector)
        import os
        db_url = os.environ.get("DATABASE_URL", "")
        if not db_url:
            logger.error("DATABASE_URL not set — cannot write to news queue")
            return

        conn = psycopg2.connect(**_parse_database_url(db_url))
        conn.autocommit = True

        try:
            # Check if already notified
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT 1 FROM {_TABLE_PREFIX}entity_notifications "
                    f"WHERE entity_type = %s AND entity_id = %s",
                    (entity_type, entity_id),
                )
                if cur.fetchone():
                    logger.info("Entity %s id=%d already notified, skipping", entity_type, entity_id)
                    return

            # Build announcement text
            direction = ""
            if hasattr(entity, "direction") and entity.direction:
                direction = str(entity.direction)
            stage = ""
            if hasattr(entity, "stage") and entity.stage:
                stage = str(entity.stage)

            template = _ENTITY_TEMPLATES[entity_type]
            text = template.format(
                title=entity.title or "",
                short_description=entity.short_description or "",
                direction=direction,
                stage=stage,
                id=entity_id,
            )

            # Insert into moderation queue with status='pending_bot'
            from datetime import datetime
            now = datetime.utcnow()
            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {_TABLE_PREFIX}moderation_queue
                        (source_channel, source_msg_id, original_text, media_type, media_filename,
                         status, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, 'pending_bot', %s, %s)
                        RETURNING id""",
                    ("platform", None, text, "", "", now, now),
                )
                queue_id = cur.fetchone()[0]

            # Mark as notified
            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {_TABLE_PREFIX}entity_notifications
                        (entity_type, entity_id, queue_id)
                        VALUES (%s, %s, %s) ON CONFLICT (entity_type, entity_id) DO NOTHING""",
                    (entity_type, entity_id, queue_id),
                )

            logger.info(
                "Entity notification queued: %s id=%d → queue #%d",
                entity_type, entity_id, queue_id,
            )
        finally:
            conn.close()

    except Exception as e:
        logger.error("notify_entity_approved failed: %s", e, exc_info=True)
        raise self.retry(exc=e, countdown=30)


def convert_to_webp_in_memory(file_data, file_name, content_type, quality=85):
    """
    Конвертирует изображение в WebP формат в памяти.
    
    Args:
        file_data: bytes данные файла
        file_name: имя файла
        content_type: MIME тип файла
        quality: качество сжатия (1-100)
    
    Returns:
        tuple: (webp_bytes, new_filename, new_content_type) или (None, None, None) если конвертация не нужна
    """
    try:
        # Проверяем, что это изображение
        if not content_type or not content_type.startswith('image/'):
            return None, None, None
        
        # Проверяем расширение
        ext = file_name.lower().split('.')[-1] if '.' in file_name else ''
        image_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'}
        
        if ext not in image_extensions:
            return None, None, None
        
        # Открываем изображение
        img = Image.open(BytesIO(file_data))
        original_size = len(file_data)
        
        # Сохраняем альфа-канал если есть
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        
        # Сохраняем в WebP
        output = BytesIO()
        img.save(output, 'WEBP', quality=quality, optimize=True)
        webp_data = output.getvalue()
        
        # Создаём новое имя файла
        base_name = '.'.join(file_name.split('.')[:-1]) if '.' in file_name else file_name
        new_name = f"{base_name}.webp"
        
        new_size = len(webp_data)
        reduction = ((original_size - new_size) / original_size * 100) if original_size > 0 else 0
        
        logger.info(f"[WebP] {file_name} -> {new_name}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% экономия)")
        
        return webp_data, new_name, 'image/webp'
        
    except Exception as e:
        logger.warning(f"Ошибка конвертации в WebP: {e}")
        return None, None, None


def try_save_file_to_s3(file_content, file_path, content_type='application/octet-stream'):
    """Загружает файл в S3 напрямую через boto3 (без default_storage)."""
    try:
        if hasattr(file_content, 'seek'):
            file_content.seek(0)
        # Читаем байты если это file-like объект
        if hasattr(file_content, 'read'):
            body = file_content.read()
        else:
            body = file_content
        s3 = boto3.client(
            's3',
            endpoint_url=getattr(settings, 'AWS_S3_ENDPOINT_URL', None),
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', None),
            config=boto3.session.Config(s3={'addressing_style': getattr(settings, 'AWS_S3_ADDRESSING_STYLE', 'virtual')})
        )
        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        s3.put_object(Bucket=bucket, Key=file_path, Body=body, ContentType=content_type, ACL='public-read')
        logger.info(f"Файл успешно загружен в S3: {file_path} ({len(body)} байт)")
        return True
    except Exception as e:
        logger.error(f"Ошибка загрузки в S3 для {file_path}: {e}", exc_info=True)
        return False


@shared_task(bind=True, max_retries=3)
def upload_video_to_s3(self, video_data, video_name, video_content_type, entity_id, original_filename, entity_type_name='startup'):
    try:
        video_id = str(uuid.uuid4())
        entity_folder = {
            'startup': 'startups',
            'franchise': 'franchises',
            'agency': 'agencies',
            'specialist': 'specialists',
        }.get(entity_type_name, f"{entity_type_name}s")
        file_path = f"{entity_folder}/{entity_id}/videos/{video_id}_{original_filename}"
        
        logger.info(f"Начало загрузки видео ({entity_type_name}): {file_path}, размер: {len(video_data)} байт")
        
        from io import BytesIO
        if isinstance(video_data, str):
            video_data = base64.b64decode(video_data)
        video_file = BytesIO(video_data)
        
        if not try_save_file_to_s3(video_file, file_path, video_content_type):
            raise Exception("Не удалось сохранить видео в S3")
        
        logger.info(f"Видео успешно загружено: {file_path}")
        
        video_type, _ = FileTypes.objects.get_or_create(type_name="video")
        entity_type, _ = EntityTypes.objects.get_or_create(type_name=entity_type_name)
        
        from .models import Startups, Franchises, Agencies, Specialists
        
        entity_model = {'startup': Startups, 'franchise': Franchises, 'agency': Agencies, 'specialist': Specialists}.get(entity_type_name)
        entity = entity_model.objects.filter(pk=entity_id).first() if entity_model else None
        
        if not entity:
            logger.error(f"Entity {entity_type_name} с id={entity_id} не найден!")
            return {'success': False, 'error': f'{entity_type_name} not found'}
        
        existing_file = FileStorage.objects.filter(file_url=video_id).first()
        if not existing_file:
            FileStorage.objects.create(
                entity_type=entity_type,
                entity_id=entity_id,
                file_type=video_type,
                file_url=video_id,
                uploaded_at=timezone.now(),
                startup=entity if entity_type_name == 'startup' else None,
                original_file_name=original_filename,
            )
            logger.info(f"FileStorage создан для видео: {video_id}")
        else:
            logger.warning(f"FileStorage с video_id {video_id} уже существует! Пропускаем создание.")
        
        if entity:
            from django.db import connection
            
            # Используем raw SQL для атомарного обновления JSONField
            # Это решает проблему race condition при параллельных Celery задачах
            def atomic_append_video_to_json_array(model, pk_field, pk_value, new_value):
                """Атомарно добавляет video_id в JSON массив, избегая race condition"""
                table_name = model._meta.db_table
                with connection.cursor() as cursor:
                    # PostgreSQL: используем jsonb для атомарного обновления
                    sql = f"""
                        UPDATE {table_name}
                        SET video_urls = COALESCE(video_urls, '[]'::jsonb) || %s::jsonb
                        WHERE {pk_field} = %s
                        AND NOT (COALESCE(video_urls, '[]'::jsonb) @> %s::jsonb)
                    """
                    cursor.execute(sql, [f'["{new_value}"]', pk_value, f'["{new_value}"]'])
                    updated = cursor.rowcount > 0
                    logger.info(f"atomic_append_video_to_json_array: table={table_name}, pk_field={pk_field}, pk_value={pk_value}, updated={updated}")
                    return updated
            
            # Используем db_column (имя колонки в БД), а не name (имя поля Django)
            pk_field = entity_model._meta.pk.column or entity_model._meta.pk.name
            logger.info(f"Video upload - Entity model: {entity_model.__name__}, pk_field (db_column): {pk_field}, entity_id: {entity_id}")
            
            if atomic_append_video_to_json_array(entity_model, pk_field, entity_id, video_id):
                logger.info(f"✅ video_id {video_id} атомарно добавлен в {entity_type_name}.video_urls")
            else:
                logger.warning(f"⚠️ video_id {video_id} уже есть в video_urls или entity не найден")
        
        return {
            'success': True,
            'video_id': video_id,
            'file_path': file_path
        }
        
    except Exception as e:
        logger.error(f"Ошибка загрузки видео: {e}", exc_info=True)
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def upload_file_to_s3(self, file_data, file_name, file_content_type, entity_type_name, entity_id, file_type_name, original_filename, file_id=None):
    try:
        if file_id is None:
            file_id = str(uuid.uuid4())
        entity_folder = {
            'startup': 'startups',
            'franchise': 'franchises',
            'agency': 'agencies',
            'specialist': 'specialists',
        }.get(entity_type_name, f"{entity_type_name}s")
        # Всегда добавляем 's' к типу файла для консистентности с utils._prefix_for
        file_type_folder = f"{file_type_name}s"
        
        # Декодируем данные файла
        if isinstance(file_data, str):
            file_data = base64.b64decode(file_data)
        
        # Конвертируем изображения в WebP для экономии места
        # (применяется к logo, creative, catalog_card_image)
        webp_data, webp_filename, webp_content_type = convert_to_webp_in_memory(
            file_data, original_filename, file_content_type
        )
        
        if webp_data:
            # Используем сконвертированный WebP файл
            file_data = webp_data
            original_filename = webp_filename
            file_content_type = webp_content_type
            logger.info(f"Файл сконвертирован в WebP: {webp_filename}")
        
        # Специальный путь для catalog_card_image — хранится в catalog_cards/ без entity_id
        if file_type_name == 'catalog_card_image':
            file_path = f"catalog_cards/{file_id}_{original_filename}"
        else:
            file_path = f"{entity_folder}/{entity_id}/{file_type_folder}/{file_id}_{original_filename}"
        
        logger.info(f"Начало загрузки файла: {file_path}")
        
        from io import BytesIO
        file_obj = BytesIO(file_data)
        
        if not try_save_file_to_s3(file_obj, file_path, file_content_type):
            raise Exception(f"Не удалось сохранить файл {file_name} в S3")
        
        logger.info(f"Файл успешно загружен: {file_path}")
        
        file_type, _ = FileTypes.objects.get_or_create(type_name=file_type_name)
        entity_type, _ = EntityTypes.objects.get_or_create(type_name=entity_type_name)
        
        from .models import Startups, Franchises, Agencies, Specialists
        entity_model = {'startup': Startups, 'franchise': Franchises, 'agency': Agencies, 'specialist': Specialists}.get(entity_type_name)
        # Используем filter().first() вместо get() чтобы избежать MultipleObjectsReturned
        entity = entity_model.objects.filter(pk=entity_id).first() if entity_model else None
        
        if not entity:
            logger.error(f"Entity {entity_type_name} с id={entity_id} не найден!")
            return {'success': False, 'error': f'{entity_type_name} not found'}
        
        existing_file = FileStorage.objects.filter(file_url=file_id).first()
        if not existing_file:
            FileStorage.objects.create(
                entity_type=entity_type,
                entity_id=entity_id,
                file_type=file_type,
                file_url=file_id,
                uploaded_at=timezone.now(),
                startup=entity if entity_type_name == 'startup' else None,
                original_file_name=original_filename,
            )
            logger.info(f"FileStorage создан для файла: {file_id}")
        else:
            logger.warning(f"FileStorage с file_id {file_id} уже существует! Пропускаем создание.")

        # Update entity's file_urls (e.g., logo_urls, creatives_urls, proofs_urls)
        if entity:
            from django.db import transaction, connection
            
            # Используем raw SQL для атомарного обновления JSONField
            # Это решает проблему race condition при параллельных Celery задачах
            def atomic_append_to_json_array(model, pk_field, pk_value, field_name, new_value):
                """Атомарно добавляет значение в JSON массив, избегая race condition"""
                table_name = model._meta.db_table
                with connection.cursor() as cursor:
                    # PostgreSQL: используем jsonb_array_elements для проверки + COALESCE
                    sql = f"""
                        UPDATE {table_name}
                        SET {field_name} = COALESCE({field_name}, '[]'::jsonb) || %s::jsonb
                        WHERE {pk_field} = %s
                        AND NOT (COALESCE({field_name}, '[]'::jsonb) @> %s::jsonb)
                    """
                    cursor.execute(sql, [f'["{new_value}"]', pk_value, f'["{new_value}"]'])
                    updated = cursor.rowcount > 0
                    logger.info(f"atomic_append_to_json_array: table={table_name}, pk_field={pk_field}, pk_value={pk_value}, field={field_name}, updated={updated}")
                    return updated
            
            # Используем db_column (имя колонки в БД), а не name (имя поля Django)
            pk_field = entity_model._meta.pk.column or entity_model._meta.pk.name
            logger.info(f"Entity model: {entity_model.__name__}, pk_field (db_column): {pk_field}, entity_id: {entity_id}")
            
            if file_type_name == 'logo':
                if atomic_append_to_json_array(entity_model, pk_field, entity_id, 'logo_urls', file_id):
                    logger.info(f"✅ file_id {file_id} атомарно добавлен в {entity_type_name}.logo_urls")
                else:
                    logger.warning(f"⚠️ file_id {file_id} уже есть в logo_urls или entity не найден")
            elif file_type_name == 'creative':
                if atomic_append_to_json_array(entity_model, pk_field, entity_id, 'creatives_urls', file_id):
                    logger.info(f"✅ file_id {file_id} атомарно добавлен в {entity_type_name}.creatives_urls")
                else:
                    logger.warning(f"⚠️ file_id {file_id} уже есть в creatives_urls или entity не найден")
            elif file_type_name == 'proof':
                if atomic_append_to_json_array(entity_model, pk_field, entity_id, 'proofs_urls', file_id):
                    logger.info(f"✅ file_id {file_id} атомарно добавлен в {entity_type_name}.proofs_urls")
                else:
                    logger.warning(f"⚠️ file_id {file_id} уже есть в proofs_urls или entity не найден")
            elif file_type_name == 'catalog_card_image':
                with transaction.atomic():
                    entity = entity_model.objects.select_for_update().filter(pk=entity_id).first()
                    if entity:
                        entity.catalog_card_image = f"{file_id}_{original_filename}"
                        entity.save(update_fields=['catalog_card_image'])
                        logger.info(f"✅ {file_id}_{original_filename} добавлен в {entity_type_name}.catalog_card_image")
                    else:
                        logger.error(f"Entity {entity_type_name} с id={entity_id} не найден при сохранении catalog_card_image")
        
        return {
            'success': True,
            'file_id': file_id,
            'file_path': file_path
        }
        
    except Exception as e:
        logger.error(f"Ошибка загрузки файла: {e}", exc_info=True)
        raise self.retry(exc=e, countdown=60)

