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


async def main():
    config.validate()
    logger.info("Starting news collector...")

    storage = PostStorage()
    storage.cleanup()

    all_channels = get_all_channels(storage)
    logger.info("Source channels: %s", ", ".join(str(ch) for ch in all_channels))

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

    # User client — мониторинг каналов
    client = create_client()
    register_handlers(client, storage)

    # Bot client — админ-панель
    bot = create_bot_client()
    register_admin_handlers(bot, storage)

    # Graceful shutdown
    stop_event = asyncio.Event()

    def shutdown(sig, _frame):
        logger.info("Received signal %s, shutting down...", signal.Signals(sig).name)
        stop_event.set()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Start both clients
    await client.start(phone=config.TELEGRAM_PHONE)
    logger.info("User client connected to Telegram")

    await bot.start(bot_token=config.NEWS_BOT_TOKEN)
    logger.info("Admin bot connected (admin_id=%d)", config.ADMIN_ID)

    logger.info("Monitoring channels — waiting for new posts...")

    # Run until stop signal
    await stop_event.wait()

    logger.info("Disconnecting...")
    await client.disconnect()
    await bot.disconnect()
    storage.close()
    logger.info("Stopped")


if __name__ == "__main__":
    asyncio.run(main())
