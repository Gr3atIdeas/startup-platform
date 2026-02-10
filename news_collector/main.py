import signal
import logging
import asyncio

import config
from collector import create_client, register_handlers
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
    logger.info("Source channels: %s", ", ".join(config.SOURCE_CHANNELS_LIST))
    if config.KEYWORDS_LIST:
        logger.info("Keyword filter: %s", ", ".join(config.KEYWORDS_LIST))
    else:
        logger.info("No keyword filter — forwarding all posts")

    storage = PostStorage()
    storage.cleanup()

    client = create_client()
    register_handlers(client, storage)

    # Graceful shutdown
    stop_event = asyncio.Event()

    def shutdown(sig, _frame):
        logger.info("Received signal %s, shutting down...", signal.Signals(sig).name)
        stop_event.set()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    await client.start(phone=config.TELEGRAM_PHONE)
    logger.info("Connected to Telegram")
    logger.info("Monitoring channels — waiting for new posts...")

    # Run until stop signal
    await stop_event.wait()

    logger.info("Disconnecting...")
    await client.disconnect()
    storage.close()
    logger.info("Stopped")


if __name__ == "__main__":
    asyncio.run(main())
