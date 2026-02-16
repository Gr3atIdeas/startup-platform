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


def get_all_channels(storage: PostStorage) -> set:
    """Get combined set of env + dynamic channels."""
    env_ch = set(config.SOURCE_CHANNELS_LIST)
    db_ch = set(storage.get_channels())
    return env_ch | db_ch


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
    """Register event handler that dynamically checks channel list."""

    @client.on(events.NewMessage())
    async def on_new_message(event):
        # Динамически проверяем, входит ли канал в отслеживаемый список
        chat_id = event.chat_id
        channels = get_all_channels(storage)

        # Проверяем по числовому ID и по username
        is_monitored = False
        if chat_id in channels or str(chat_id) in channels:
            is_monitored = True
        elif hasattr(event.chat, "username") and event.chat.username:
            if event.chat.username in channels:
                is_monitored = True

        if not is_monitored:
            return

        await handle_new_message(event, storage)

    all_ch = get_all_channels(storage)
    logger.info("Registered handler for %d channels: %s", len(all_ch), ", ".join(str(ch) for ch in all_ch))
