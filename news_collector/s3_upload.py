"""Upload files to S3 (Yandex Cloud) for news article images."""

import logging
import uuid

import boto3
from botocore.config import Config as BotoConfig

import config

logger = logging.getLogger(__name__)


def upload_news_image(image_bytes: bytes, article_id: int, ext: str = "jpg") -> str | None:
    """Upload image bytes to S3 and return the relative path (for image_url field).

    Returns path like 'news/42/abc123.jpg' or None on failure.
    """
    if not config.AWS_ACCESS_KEY_ID or not config.AWS_SECRET_ACCESS_KEY:
        logger.warning("S3 credentials not configured, skipping image upload")
        return None

    key = f"news/{article_id}/{uuid.uuid4().hex[:12]}.{ext}"

    content_type_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    content_type = content_type_map.get(ext.lower(), "image/jpeg")

    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=config.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
            region_name="ru-central1",
            config=BotoConfig(signature_version="s3v4"),
        )
        s3.put_object(
            Bucket=config.AWS_STORAGE_BUCKET_NAME,
            Key=key,
            Body=image_bytes,
            ContentType=content_type,
            ACL="public-read",
        )
        logger.info("Uploaded news image to S3: %s", key)
        return key
    except Exception as e:
        logger.error("Failed to upload image to S3: %s", e)
        return None
