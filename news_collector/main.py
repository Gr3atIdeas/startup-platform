import os
import signal
import logging
import asyncio

import config
from collector import create_client, register_handlers, get_all_channels
from admin import create_bot_client, register_admin_handlers
from moderation import register_moderation_handlers
from storage import PostStorage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("news_collector")

# Shared state — user client reference (set after auth)
_state = {"client": None}


async def start_user_client(storage, bot=None):
    """Try to start Telethon user client for channel monitoring.

    Uses StringSession from TELETHON_SESSION env var if available (survives deploys).
    Falls back to file-based session.
    """
    if _state["client"]:
        logger.info("User client already running")
        return _state["client"]

    if not config.TELEGRAM_PHONE:
        logger.warning("TELEGRAM_PHONE not set — channel monitoring disabled")
        return None

    # Check for session: env var (StringSession) or file
    has_env_session = bool(config.TELETHON_SESSION)
    session_file = config.SESSION_PATH + ".session"
    has_file_session = os.path.exists(session_file)

    if not has_env_session and not has_file_session:
        logger.info("No Telethon session yet. Send /auth to the bot to authenticate.")
        return None

    try:
        session_str = config.TELETHON_SESSION if has_env_session else ""
        client = create_client(session_string=session_str)
        register_handlers(client, storage, bot=bot)
        await client.start(phone=config.TELEGRAM_PHONE)

        source = "env (StringSession)" if has_env_session else "file"
        all_channels = get_all_channels(storage)
        logger.info(
            "User client connected via %s. Monitoring %d channels: %s",
            source, len(all_channels),
            ", ".join(str(ch) for ch in all_channels),
        )
        _state["client"] = client
        return client
    except Exception as e:
        logger.error("Failed to start user client: %s", e)
        return None


async def main():
    config.validate()
    logger.info("Starting news collector...")

    storage = PostStorage()
    storage.cleanup()

    # ── Bot client — admin panel (starts FIRST, no interactive auth) ──
    bot = create_bot_client()
    register_admin_handlers(
        bot, storage,
        on_auth_complete=lambda: start_user_client(storage, bot=bot),
        is_monitoring=lambda: _state["client"] is not None,
    )
    register_moderation_handlers(bot, storage)

    await bot.start(bot_token=config.NEWS_BOT_TOKEN)
    logger.info("Admin bot connected (admin_id=%d)", config.ADMIN_ID)

    # ── User client — channel monitoring (auto-start if session exists) ──
    await start_user_client(storage, bot=bot)

    if _state["client"]:
        logger.info("Monitoring channels — waiting for new posts...")
    else:
        logger.info("Bot-only mode. Send /auth to the bot to start channel monitoring.")

    # Graceful shutdown
    stop_event = asyncio.Event()

    def shutdown(sig, _frame):
        logger.info("Received signal %s, shutting down...", signal.Signals(sig).name)
        stop_event.set()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    await stop_event.wait()

    logger.info("Disconnecting...")
    if _state["client"]:
        await _state["client"].disconnect()
    await bot.disconnect()
    storage.close()
    logger.info("Stopped")


if __name__ == "__main__":
    asyncio.run(main())
