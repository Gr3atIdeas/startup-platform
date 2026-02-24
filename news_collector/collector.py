import logging

from telethon import TelegramClient, events
from telethon.sessions import StringSession

import config
from filters import should_process
from moderation import enqueue_post
from storage import PostStorage

logger = logging.getLogger(__name__)


def create_client(session_string: str = "") -> TelegramClient:
    """Create Telethon user client.

    If session_string is provided, uses StringSession (persistent across deploys).
    Otherwise falls back to file-based session.
    """
    if session_string:
        session = StringSession(session_string)
    else:
        session = config.SESSION_PATH
    return TelegramClient(
        session,
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


def get_post_link(event) -> str:
    """Build direct link to source post (t.me/channel/msg_id)."""
    chat = event.chat
    msg_id = event.message.id
    if hasattr(chat, "username") and chat.username:
        return f"https://t.me/{chat.username}/{msg_id}"
    return ""


async def handle_new_message(event, storage: PostStorage, bot: TelegramClient = None):
    """Process a single new message from a monitored channel."""
    if not should_process(event, storage):
        return

    message = event.message
    source = get_source_label(event)
    post_link = get_post_link(event)
    text = message.text or ""

    logger.info("New post from %s (msg_id=%d)", source, message.id)

    try:
        media_type = ''
        media_bytes = None
        filename = ''

        if message.photo:
            media_type = 'photo'
            media_bytes = await message.download_media(bytes)
        elif message.video:
            media_type = 'video'
            media_bytes = await message.download_media(bytes)
        elif message.document:
            # Check if this document is actually an image
            mime = getattr(message.document, "mime_type", "") or ""
            if mime.startswith("image/"):
                media_type = 'photo'
            else:
                media_type = 'document'
                filename = getattr(message.document, "file_name", None) or "document"
            media_bytes = await message.download_media(bytes)
        elif not text:
            logger.debug("Skipping unsupported media type in message %d", message.id)
            return

        await enqueue_post(
            bot=bot, storage=storage,
            text=text, source=source, post_link=post_link,
            media_type=media_type, media_bytes=media_bytes,
            filename=filename,
        )

        storage.mark_processed(str(event.chat_id), message.id)
        logger.info("Queued message %d from %s for moderation", message.id, source)

    except Exception as e:
        logger.error("Failed to process message %d from %s: %s", message.id, source, e)


def register_handlers(client: TelegramClient, storage: PostStorage, bot: TelegramClient = None):
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

        await handle_new_message(event, storage, bot=bot)

    all_ch = get_all_channels(storage)
    logger.info("Registered handler for %d channels: %s", len(all_ch), ", ".join(str(ch) for ch in all_ch))
