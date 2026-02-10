import logging

from telethon.tl.types import MessageService

from config import KEYWORDS_LIST
from storage import PostStorage

logger = logging.getLogger(__name__)


def should_process(event, storage: PostStorage) -> bool:
    """Check if message should be forwarded."""
    message = event.message

    # Skip service messages (user joined, pinned message, etc.)
    if isinstance(message, MessageService):
        logger.debug("Skipping service message %d", message.id)
        return False

    # Skip empty messages
    if not message.text and not message.media:
        logger.debug("Skipping empty message %d", message.id)
        return False

    # Check duplicates
    channel_id = str(event.chat_id)
    if storage.is_processed(channel_id, message.id):
        logger.debug("Skipping duplicate message %d from %s", message.id, channel_id)
        return False

    # Keyword filter (if configured)
    if KEYWORDS_LIST and message.text:
        text_lower = message.text.lower()
        if not any(kw in text_lower for kw in KEYWORDS_LIST):
            logger.debug("Skipping message %d — no matching keywords", message.id)
            return False

    return True
