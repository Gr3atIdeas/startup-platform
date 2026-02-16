import os
import signal
import logging
import asyncio

import config
from collector import create_client, register_handlers, get_all_channels
from admin import create_bot_client, register_admin_handlers
from storage import PostStorage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("news_collector")


async def start_user_client(storage):
    """Try to start Telethon user client for channel monitoring.

    Returns the connected client, or None if it can't start
    (missing phone, no session file, auth error, etc.).
    """
    if not config.TELEGRAM_PHONE:
        logger.warning("TELEGRAM_PHONE not set — channel monitoring disabled")
        return None

    session_file = config.SESSION_PATH + ".session"
    if not os.path.exists(session_file):
        logger.warning(
            "Telethon session file not found: %s. "
            "Run 'python news_collector/create_session.py' to authenticate. "
            "Channel monitoring disabled.",
            session_file,
        )
        return None

    try:
        client = create_client()
        register_handlers(client, storage)
        await client.start(phone=config.TELEGRAM_PHONE)

        all_channels = get_all_channels(storage)
        logger.info(
            "User client connected. Monitoring %d channels: %s",
            len(all_channels),
            ", ".join(str(ch) for ch in all_channels),
        )
        return client
    except Exception as e:
        logger.error("Failed to start user client: %s", e)
        logger.info("Admin bot will continue without channel monitoring.")
        return None


async def main():
    config.validate()
    logger.info("Starting news collector...")

    storage = PostStorage()
    storage.cleanup()

    # ── Bot client — admin panel (starts FIRST, no interactive auth) ──
    bot = create_bot_client()
    register_admin_handlers(bot, storage)

    await bot.start(bot_token=config.NEWS_BOT_TOKEN)
    logger.info("Admin bot connected (admin_id=%d)", config.ADMIN_ID)

    # ── User client — channel monitoring (may be unavailable) ──
    client = await start_user_client(storage)

    if client:
        if config.KEYWORDS_LIST:
            logger.info("Keyword filter (env): %s", ", ".join(config.KEYWORDS_LIST))
        db_keywords = storage.get_keywords()
        if db_keywords:
            logger.info("Keyword filter (dynamic): %s", ", ".join(db_keywords))
        if not config.KEYWORDS_LIST and not db_keywords:
            logger.info("No keyword filter — forwarding all posts")

        spam_words = storage.get_spam_words()
        if spam_words:
            logger.info("Spam filter: %s", ", ".join(spam_words))

        logger.info("Monitoring channels — waiting for new posts...")
    else:
        logger.info("Running in bot-only mode (no channel monitoring).")
        logger.info("Use /status in admin bot to check configuration.")

    # Graceful shutdown
    stop_event = asyncio.Event()

    def shutdown(sig, _frame):
        logger.info("Received signal %s, shutting down...", signal.Signals(sig).name)
        stop_event.set()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Run until stop signal
    await stop_event.wait()

    logger.info("Disconnecting...")
    if client:
        await client.disconnect()
    await bot.disconnect()
    storage.close()
    logger.info("Stopped")


if __name__ == "__main__":
    asyncio.run(main())
