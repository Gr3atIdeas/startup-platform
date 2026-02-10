import io
import time
import logging

import requests

from config import NEWS_BOT_TOKEN, TARGET_GROUP_ID

logger = logging.getLogger(__name__)

BOT_API = f"https://api.telegram.org/bot{NEWS_BOT_TOKEN}"
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds, doubles each retry


def _request(method: str, data: dict = None, files: dict = None) -> dict | None:
    url = f"{BOT_API}/{method}"
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(url, data=data, files=files, timeout=30)
            result = resp.json()
            if result.get("ok"):
                return result
            # Rate limit
            if resp.status_code == 429:
                retry_after = result.get("parameters", {}).get("retry_after", 5)
                logger.warning("Rate limited, waiting %ds", retry_after)
                time.sleep(retry_after)
                continue
            logger.error("Bot API error: %s", result.get("description", "unknown"))
            return None
        except requests.RequestException as e:
            delay = RETRY_DELAY * (2 ** attempt)
            logger.warning("Request failed (attempt %d/%d): %s. Retry in %ds", attempt + 1, MAX_RETRIES, e, delay)
            time.sleep(delay)
    logger.error("All %d attempts failed for %s", MAX_RETRIES, method)
    return None


def send_message(text: str, source_name: str = None):
    if source_name:
        text = f"{text}\n\n📢 <b>Источник:</b> {source_name}"
    return _request("sendMessage", {
        "chat_id": TARGET_GROUP_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    })


def send_photo(photo_bytes: bytes, caption: str = "", source_name: str = None):
    if source_name:
        caption = f"{caption}\n\n📢 <b>Источник:</b> {source_name}" if caption else f"📢 <b>Источник:</b> {source_name}"
    return _request(
        "sendPhoto",
        data={
            "chat_id": TARGET_GROUP_ID,
            "caption": caption[:1024],
            "parse_mode": "HTML",
        },
        files={"photo": ("photo.jpg", io.BytesIO(photo_bytes), "image/jpeg")},
    )


def send_video(video_bytes: bytes, caption: str = "", source_name: str = None):
    if source_name:
        caption = f"{caption}\n\n📢 <b>Источник:</b> {source_name}" if caption else f"📢 <b>Источник:</b> {source_name}"
    return _request(
        "sendVideo",
        data={
            "chat_id": TARGET_GROUP_ID,
            "caption": caption[:1024],
            "parse_mode": "HTML",
        },
        files={"video": ("video.mp4", io.BytesIO(video_bytes), "video/mp4")},
    )


def send_document(doc_bytes: bytes, filename: str, caption: str = "", source_name: str = None):
    if source_name:
        caption = f"{caption}\n\n📢 <b>Источник:</b> {source_name}" if caption else f"📢 <b>Источник:</b> {source_name}"
    return _request(
        "sendDocument",
        data={
            "chat_id": TARGET_GROUP_ID,
            "caption": caption[:1024],
            "parse_mode": "HTML",
        },
        files={"document": (filename, io.BytesIO(doc_bytes), "application/octet-stream")},
    )
