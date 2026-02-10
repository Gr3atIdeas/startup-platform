import logging

from telethon import TelegramClient, events

import config
from filters import should_process
from publisher import send_message, send_photo, send_video, send_document
from storage import PostStorage

logger = logging.getLogger(__name__)


def create_client() -> TelegramClient:
    return TelegramClient(
        config.SESSION_PATH,
        int(config.TELEGRAM_API_ID),
        config.TELEGRAM_API_HASH,
    )


def get_source_label(event) -> str:
    """Get readable channel name for source attribution."""
    chat = event.chat
    if hasattr(chat, "username") and chat.username:
        return f"@{chat.username}"
    if hasattr(chat, "title") and chat.title:
        return chat.title
    return str(event.chat_id)


async def handle_new_message(event, storage: PostStorage):
    """Process a single new message from a monitored channel."""
    if not should_process(event, storage):
        return

    message = event.message
    source = get_source_label(event)
    text = message.text or ""

    logger.info("New post from %s (msg_id=%d)", source, message.id)

    try:
        if message.photo:
            photo_bytes = await message.download_media(bytes)
            send_photo(photo_bytes, caption=text, source_name=source)
        elif message.video:
            video_bytes = await message.download_media(bytes)
            send_video(video_bytes, caption=text, source_name=source)
        elif message.document:
            doc_bytes = await message.download_media(bytes)
            filename = getattr(message.document, "file_name", None) or "document"
            # If it's a GIF/animation, treat as document
            send_document(doc_bytes, filename, caption=text, source_name=source)
        elif text:
            send_message(text, source_name=source)
        else:
            logger.debug("Skipping unsupported media type in message %d", message.id)
            return

        storage.mark_processed(str(event.chat_id), message.id)
        logger.info("Forwarded message %d from %s", message.id, source)

    except Exception as e:
        logger.error("Failed to forward message %d from %s: %s", message.id, source, e)


def register_handlers(client: TelegramClient, storage: PostStorage):
    """Register event handlers for monitoring channels."""
    channels = config.SOURCE_CHANNELS_LIST

    @client.on(events.NewMessage(chats=channels))
    async def on_new_message(event):
        await handle_new_message(event, storage)

    logger.info("Registered handlers for channels: %s", ", ".join(channels))
