"""Admin bot — управление news collector через личные сообщения боту."""

import logging
from datetime import datetime

from telethon import TelegramClient, events

import config
from storage import PostStorage

logger = logging.getLogger(__name__)

HELP_TEXT = """<b>📋 Команды админ-панели</b>

<b>Статус:</b>
/status — текущее состояние коллектора

<b>Каналы:</b>
/channels — список отслеживаемых каналов
/add_channel &lt;id или username&gt; — добавить канал
/remove_channel &lt;id или username&gt; — удалить канал

<b>Ключевые слова (фильтр):</b>
/keywords — список ключевых слов
/add_keyword &lt;слово&gt; — добавить ключевое слово
/remove_keyword &lt;слово&gt; — удалить ключевое слово

<b>Спам-фильтр:</b>
/spam — список спам-слов
/add_spam &lt;слово&gt; — добавить спам-слово
/remove_spam &lt;слово&gt; — удалить спам-слово

<i>Каналы из env (SOURCE_CHANNELS) + динамические каналы объединяются.
Ключевые слова из env (KEYWORDS) + динамические объединяются.
Если ключевых слов нет — пересылаются все посты.
Посты со спам-словами всегда игнорируются.</i>"""


def _parse_channel_arg(arg: str):
    """Parse channel argument — int if numeric, else string."""
    arg = arg.strip().lstrip("@")
    try:
        return int(arg)
    except ValueError:
        return arg


def create_bot_client() -> TelegramClient:
    """Create a Telethon client for the bot."""
    session_path = config.SESSION_PATH + "_bot"
    return TelegramClient(
        session_path,
        int(config.TELEGRAM_API_ID),
        config.TELEGRAM_API_HASH,
    )


def register_admin_handlers(bot: TelegramClient, storage: PostStorage):
    """Register admin command handlers on the bot client."""

    @bot.on(events.NewMessage(pattern="/start"))
    async def on_start(event):
        if event.sender_id != config.ADMIN_ID:
            await event.reply("⛔ Доступ запрещён.")
            return
        await event.reply(HELP_TEXT, parse_mode="html")

    @bot.on(events.NewMessage(pattern="/help"))
    async def on_help(event):
        if event.sender_id != config.ADMIN_ID:
            return
        await event.reply(HELP_TEXT, parse_mode="html")

    @bot.on(events.NewMessage(pattern="/status"))
    async def on_status(event):
        if event.sender_id != config.ADMIN_ID:
            return

        env_channels = config.SOURCE_CHANNELS_LIST
        db_channels = storage.get_channels()
        all_channels = list(set(str(c) for c in env_channels + db_channels))

        env_keywords = config.KEYWORDS_LIST
        db_keywords = storage.get_keywords()
        all_keywords = list(set(env_keywords + db_keywords))

        spam_words = storage.get_spam_words()
        processed = storage.get_processed_count()

        text = f"""<b>📊 Статус коллектора</b>

<b>Каналы:</b> {len(all_channels)} ({len(env_channels)} env + {len(db_channels)} динамических)
<b>Ключевые слова:</b> {len(all_keywords)} ({len(env_keywords)} env + {len(db_keywords)} динамических)
<b>Спам-слов:</b> {len(spam_words)}
<b>Обработано постов:</b> {processed}
<b>Target:</b> {config.TARGET_GROUP_ID}
<b>Время:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"""
        await event.reply(text, parse_mode="html")

    # ── Channels ──────────────────────────────────────────────────

    @bot.on(events.NewMessage(pattern="/channels"))
    async def on_channels(event):
        if event.sender_id != config.ADMIN_ID:
            return

        env_ch = config.SOURCE_CHANNELS_LIST
        db_ch = storage.get_channels()

        lines = ["<b>📡 Каналы</b>\n"]
        if env_ch:
            lines.append("<b>Из env:</b>")
            for ch in env_ch:
                lines.append(f"  • {ch}")
        if db_ch:
            lines.append("\n<b>Динамические:</b>")
            for ch in db_ch:
                lines.append(f"  • {ch}")
        if not env_ch and not db_ch:
            lines.append("Нет каналов.")

        await event.reply("\n".join(lines), parse_mode="html")

    @bot.on(events.NewMessage(pattern=r"/add_channel\s+(.+)"))
    async def on_add_channel(event):
        if event.sender_id != config.ADMIN_ID:
            return
        arg = event.pattern_match.group(1)
        channel = _parse_channel_arg(arg)
        storage.add_channel(channel)
        await event.reply(f"✅ Канал <code>{channel}</code> добавлен.", parse_mode="html")
        logger.info("Admin added channel: %s", channel)

    @bot.on(events.NewMessage(pattern=r"/remove_channel\s+(.+)"))
    async def on_remove_channel(event):
        if event.sender_id != config.ADMIN_ID:
            return
        arg = event.pattern_match.group(1)
        channel = _parse_channel_arg(arg)
        if storage.remove_channel(channel):
            await event.reply(f"🗑 Канал <code>{channel}</code> удалён.", parse_mode="html")
            logger.info("Admin removed channel: %s", channel)
        else:
            await event.reply(f"❌ Канал <code>{channel}</code> не найден в динамических.", parse_mode="html")

    # ── Keywords ──────────────────────────────────────────────────

    @bot.on(events.NewMessage(pattern="/keywords$"))
    async def on_keywords(event):
        if event.sender_id != config.ADMIN_ID:
            return

        env_kw = config.KEYWORDS_LIST
        db_kw = storage.get_keywords()

        lines = ["<b>🔑 Ключевые слова</b>\n"]
        if env_kw:
            lines.append("<b>Из env:</b>")
            lines.append(", ".join(env_kw))
        if db_kw:
            lines.append("\n<b>Динамические:</b>")
            lines.append(", ".join(db_kw))
        if not env_kw and not db_kw:
            lines.append("Нет ключевых слов — пересылаются все посты.")

        await event.reply("\n".join(lines), parse_mode="html")

    @bot.on(events.NewMessage(pattern=r"/add_keyword\s+(.+)"))
    async def on_add_keyword(event):
        if event.sender_id != config.ADMIN_ID:
            return
        word = event.pattern_match.group(1).strip()
        storage.add_keyword(word)
        await event.reply(f"✅ Ключевое слово <code>{word.lower()}</code> добавлено.", parse_mode="html")
        logger.info("Admin added keyword: %s", word)

    @bot.on(events.NewMessage(pattern=r"/remove_keyword\s+(.+)"))
    async def on_remove_keyword(event):
        if event.sender_id != config.ADMIN_ID:
            return
        word = event.pattern_match.group(1).strip()
        if storage.remove_keyword(word):
            await event.reply(f"🗑 Ключевое слово <code>{word.lower()}</code> удалено.", parse_mode="html")
            logger.info("Admin removed keyword: %s", word)
        else:
            await event.reply(f"❌ Слово <code>{word.lower()}</code> не найдено.", parse_mode="html")

    # ── Spam words ────────────────────────────────────────────────

    @bot.on(events.NewMessage(pattern="/spam$"))
    async def on_spam(event):
        if event.sender_id != config.ADMIN_ID:
            return

        words = storage.get_spam_words()
        if words:
            text = "<b>🚫 Спам-слова</b>\n\n" + ", ".join(words)
        else:
            text = "<b>🚫 Спам-слова</b>\n\nСписок пуст."
        await event.reply(text, parse_mode="html")

    @bot.on(events.NewMessage(pattern=r"/add_spam\s+(.+)"))
    async def on_add_spam(event):
        if event.sender_id != config.ADMIN_ID:
            return
        word = event.pattern_match.group(1).strip()
        storage.add_spam_word(word)
        await event.reply(f"✅ Спам-слово <code>{word.lower()}</code> добавлено.", parse_mode="html")
        logger.info("Admin added spam word: %s", word)

    @bot.on(events.NewMessage(pattern=r"/remove_spam\s+(.+)"))
    async def on_remove_spam(event):
        if event.sender_id != config.ADMIN_ID:
            return
        word = event.pattern_match.group(1).strip()
        if storage.remove_spam_word(word):
            await event.reply(f"🗑 Спам-слово <code>{word.lower()}</code> удалено.", parse_mode="html")
            logger.info("Admin removed spam word: %s", word)
        else:
            await event.reply(f"❌ Слово <code>{word.lower()}</code> не найдено.", parse_mode="html")

    logger.info("Admin bot handlers registered (admin_id=%d)", config.ADMIN_ID)
