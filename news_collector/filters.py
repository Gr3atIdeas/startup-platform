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

    text_lower = (message.text or "").lower()

    # Spam filter — always active
    spam_words = storage.get_spam_words()
    if spam_words and text_lower:
        if any(w in text_lower for w in spam_words):
            logger.debug("Skipping spam message %d (matched spam word)", message.id)
            return False

    # Keyword filter — env + dynamic combined
    all_keywords = list(set(KEYWORDS_LIST + storage.get_keywords()))
    if all_keywords and message.text:
        if not any(kw in text_lower for kw in all_keywords):
            logger.debug("Skipping message %d — no matching keywords", message.id)
            return False

    return True
