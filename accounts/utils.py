# accounts/utils.py
import uuid
import boto3
from django.conf import settings
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

def get_file_url(file_id, entity_id, file_type):
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    if file_type == 'avatar':
        prefix = f"users/{entity_id}/avatar/{file_id}_"
    else:
        prefix = f"startups/{entity_id}/{file_type}s/{file_id}_"
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if 'Contents' in response and len(response['Contents']) > 0:
            key = response['Contents'][0]['Key']
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
    
from botocore.exceptions import ClientError

def get_planet_urls():
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    prefix = 'choosable_planets/'
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if 'Contents' not in response:
            logger.warning(f"No files found in {prefix}")
            return []
        planets = [obj['Key'].split('/')[-1] for obj in response['Contents'] if obj['Key'] != prefix]
        return planets
    except ClientError as e:
        logger.error(f"Error listing planets: {e}")
        return []