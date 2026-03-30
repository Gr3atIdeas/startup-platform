import os
import signal
import logging
import asyncio

import config
from collector import create_client, register_handlers, get_all_channels
from admin import create_bot_client, register_admin_handlers, setup_bot_commands
from moderation import register_moderation_handlers, enqueue_post
from storage import PostStorage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("news_collector")

# Shared state — user client reference (set after auth)
_state = {"client": None}


async def start_user_client(storage, bot=None, force=False):
    """Try to start Telethon user client for channel monitoring.

    Uses StringSession from TELETHON_SESSION env var if available (survives deploys).
    Falls back to file-based session.
    """
    if _state["client"] and not force:
        logger.info("User client already running")
        return _state["client"]

    # Disconnect old client if forcing reconnect
    if _state["client"] and force:
        try:
            await _state["client"].disconnect()
        except Exception:
            pass
        _state["client"] = None

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


async def _monitor_user_client(storage, bot, stop_event):
    """Periodically check if user client is alive and reconnect if needed."""
    logger.info("User client health monitor started (60s interval)")
    while not stop_event.is_set():
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=60)
            break
        except asyncio.TimeoutError:
            pass

        client = _state.get("client")
        if client is None:
            continue

        try:
            connected = client.is_connected()
            if not connected:
                logger.warning("User client disconnected! Attempting reconnect...")
                new_client = await start_user_client(storage, bot=bot, force=True)
                if new_client:
                    logger.info("User client reconnected successfully")
                else:
                    logger.error("User client reconnect failed, will retry in 60s")
        except Exception as e:
            logger.error("Health check error: %s. Attempting reconnect...", e)
            try:
                new_client = await start_user_client(storage, bot=bot, force=True)
                if new_client:
                    logger.info("User client reconnected after error")
                else:
                    logger.error("User client reconnect failed, will retry in 60s")
            except Exception as e2:
                logger.error("Reconnect attempt failed: %s", e2)


async def _poll_platform_posts(bot, storage, stop_event):
    """Poll news_moderation_queue for pending_bot entries inserted by Django."""
    logger.info("Platform post poller started (10s interval)")
    _retry_counts: dict[int, int] = {}
    MAX_RETRIES = 5

    while not stop_event.is_set():
        try:
            posts = storage.get_pending_bot_posts()
            for post in posts:
                queue_id = post["id"]
                retries = _retry_counts.get(queue_id, 0)
                if retries >= MAX_RETRIES:
                    logger.error(
                        "Platform post #%d failed %d times, marking as failed",
                        queue_id, retries,
                    )
                    storage.update_moderation_queue(queue_id, status='failed')
                    _retry_counts.pop(queue_id, None)
                    continue

                text = post.get("original_text", "")
                source = post.get("source_channel", "platform")
                try:
                    ok = await enqueue_post(
                        bot, storage,
                        text=text,
                        source=source,
                        html_text=text,  # platform text is already HTML
                        queue_id=queue_id,
                    )
                    if ok:
                        logger.info("Platform post #%d sent to moderation", queue_id)
                        _retry_counts.pop(queue_id, None)
                    else:
                        _retry_counts[queue_id] = retries + 1
                        logger.warning(
                            "Platform post #%d send returned False (attempt %d/%d)",
                            queue_id, retries + 1, MAX_RETRIES,
                        )
                except Exception as e:
                    _retry_counts[queue_id] = retries + 1
                    logger.error(
                        "Failed to send platform post #%d (attempt %d/%d): %s",
                        queue_id, retries + 1, MAX_RETRIES, e,
                    )
        except Exception as e:
            logger.error("Platform poller error: %s", e)

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=10)
            break  # stop_event was set
        except asyncio.TimeoutError:
            pass  # normal — poll again


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
    await setup_bot_commands(bot)

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

    # ── Platform post poller — picks up pending_bot entries from Django ──
    poller_task = asyncio.create_task(_poll_platform_posts(bot, storage, stop_event))

    # ── User client health monitor — auto-reconnect if disconnected ──
    monitor_task = asyncio.create_task(_monitor_user_client(storage, bot, stop_event))

    await stop_event.wait()

    # Wait for tasks to finish cleanly
    poller_task.cancel()
    monitor_task.cancel()
    for task in (poller_task, monitor_task):
        try:
            await task
        except asyncio.CancelledError:
            pass

    logger.info("Disconnecting...")
    if _state["client"]:
        await _state["client"].disconnect()
    await bot.disconnect()
    storage.close()
    logger.info("Stopped")


if __name__ == "__main__":
    asyncio.run(main())
