"""Moderation pipeline — inline buttons, AI rewrite, publish to channel."""

import logging
import re
from html import escape as _html_esc

from telethon import TelegramClient, events, Button

import config
from storage import PostStorage
from grok import rewrite_news

logger = logging.getLogger(__name__)


def _to_display_html(text: str, html_text: str = '') -> str:
    """Build HTML for Telegram display — entities first, then Markdown fallback."""
    if html_text:
        out = html_text  # already HTML-safe from Telethon unparse()
    else:
        out = _html_esc(text) if text else ''
    if not out:
        return out
    # Convert Markdown bold **text** → <b>text</b>
    out = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', out, flags=re.DOTALL)
    # Convert Markdown links [text](url) → <a href="url">text</a>
    out = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', out)
    return out


def _to_jpeg(data: bytes):
    """Convert image bytes to JPEG BytesIO with .name for Telethon photo detection."""
    import io
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(data))
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=85)
        buf.seek(0)
    except Exception:
        buf = io.BytesIO(data)
    buf.name = 'photo.jpg'
    return buf


async def enqueue_post(bot: TelegramClient, storage: PostStorage,
                       text: str, source: str, post_link: str = '',
                       html_text: str = '',
                       media_type: str = '', media_bytes: bytes = None,
                       filename: str = '',
                       queue_id: int = None):
    """Save post to moderation queue and send to TARGET_GROUP with inline buttons.

    If queue_id is provided, uses existing queue entry (e.g. from platform notifications)
    instead of creating a new one.
    """
    if queue_id is None:
        queue_id = storage.add_to_moderation_queue(
            source_channel=source,
            original_text=text,
            media_type=media_type,
            media_filename=filename,
        )

    display_text = _to_display_html(text, html_text)
    source_line = f"<b>Источник:</b> {source}"
    if post_link:
        source_line += f', <a href="{post_link}">ссылка</a>'
    caption = f"{display_text}\n\n{source_line}" if display_text else source_line
    buttons = [
        [Button.inline("Пропустить", data=f"skip:{queue_id}".encode()),
         Button.inline("Отредактировать", data=f"edit:{queue_id}".encode())],
    ]

    target = int(config.TARGET_GROUP_ID)

    try:
        if media_type == 'photo' and media_bytes:
            msg = await bot.send_file(
                target, _to_jpeg(media_bytes), caption=caption[:1024],
                parse_mode='html', buttons=buttons,
            )
        elif media_type == 'video' and media_bytes:
            msg = await bot.send_file(
                target, media_bytes, caption=caption[:1024],
                parse_mode='html', buttons=buttons,
                attributes=[],
            )
        elif media_type == 'document' and media_bytes:
            msg = await bot.send_file(
                target, media_bytes, caption=caption[:1024],
                parse_mode='html', buttons=buttons,
                force_document=True,
                file_name=filename,
            )
        else:
            msg = await bot.send_message(
                target, caption, parse_mode='html', buttons=buttons,
            )

        storage.update_moderation_queue(queue_id, bot_msg_id=msg.id, status='sent')
        logger.info("Queued post #%d from %s (bot_msg=%d)", queue_id, source, msg.id)
    except Exception as e:
        logger.error("Failed to send moderation post #%d: %s", queue_id, e)


def register_moderation_handlers(bot: TelegramClient, storage: PostStorage):
    """Register callback query handlers for moderation buttons."""

    target = int(config.TARGET_GROUP_ID)

    @bot.on(events.CallbackQuery())
    async def on_callback(event):
        if event.sender_id != config.ADMIN_ID:
            await event.answer("⛔ Нет доступа", alert=True)
            return

        data = event.data.decode()

        if ":" not in data:
            return

        action, queue_id_str = data.split(":", 1)
        try:
            queue_id = int(queue_id_str)
        except ValueError:
            return

        post = storage.get_moderation_post(queue_id)
        if not post:
            await event.answer("❌ Пост не найден", alert=True)
            return

        if action == "noop":
            await event.answer()
            return
        elif action == "skip":
            await _handle_skip(event, bot, storage, post, queue_id, target)
        elif action == "edit":
            await _handle_edit(event, bot, storage, post, queue_id, target)
        elif action == "reedit":
            await _handle_reedit(event, bot, storage, post, queue_id, target)
        elif action == "pub":
            await _handle_publish(event, bot, storage, post, queue_id, target)
        else:
            await event.answer("❓ Неизвестное действие")

    logger.info("Moderation handlers registered")


async def _handle_skip(event, bot, storage, post, queue_id, target):
    """Mark as skipped — remove buttons, keep message."""
    try:
        if post.get('bot_msg_id'):
            await bot.edit_message(target, post['bot_msg_id'], buttons=None)
    except Exception as e:
        logger.warning("Failed to clear buttons for skip #%d: %s", queue_id, e)

    storage.update_moderation_queue(queue_id, status='skipped')
    await event.answer("Пропущено")
    logger.info("Skipped post #%d", queue_id)


async def _handle_edit(event, bot, storage, post, queue_id, target):
    """Rewrite text via Grok and resend with new buttons."""
    text_to_edit = post.get('edited_text') or post.get('original_text') or ''
    if not text_to_edit.strip():
        await event.answer("❌ Нет текста для редактирования", alert=True)
        return

    # Instant feedback + progress message in chat
    await event.answer()
    progress_msg = await bot.send_message(
        target, "⏳ <b>Отправляю в Grok...</b>", parse_mode='html',
    )

    try:
        rewritten = await rewrite_news(text_to_edit)
    except Exception as e:
        logger.error("Grok rewrite failed for #%d: %s", queue_id, e)
        await progress_msg.edit(
            f"❌ <b>Grok ошибка:</b> {e}",
            parse_mode='html',
        )
        return

    if not rewritten:
        await progress_msg.edit(
            "❌ <b>Grok вернул пустой ответ.</b>",
            parse_mode='html',
        )
        return

    await progress_msg.edit("✅ <b>Grok ответил, обновляю пост...</b>", parse_mode='html')

    # Remove buttons from the original message (keep it for comparison)
    original_msg_id = post.get('bot_msg_id')
    try:
        if original_msg_id:
            await bot.edit_message(target, original_msg_id, buttons=None)
    except Exception as e:
        logger.warning("Failed to clear buttons on original #%d: %s", queue_id, e)

    # Download media from original bot message if present
    media_bytes = None
    if post.get('media_type') and original_msg_id:
        try:
            msgs = await bot.get_messages(target, ids=[original_msg_id])
            if msgs and msgs[0] and msgs[0].media:
                media_bytes = await msgs[0].download_media(bytes)
        except Exception as e:
            logger.warning("Failed to download media for edit #%d: %s", queue_id, e)

    # Send edited text as reply to original message
    edit_count = (post.get('edit_count') or 0) + 1
    caption = f"{rewritten}\n\n<i>Отредактировано ({edit_count}x)</i>"
    buttons = [
        [Button.inline("Ещё раз", data=f"reedit:{queue_id}".encode()),
         Button.inline("Опубликовать", data=f"pub:{queue_id}".encode())],
        [Button.inline("Пропустить", data=f"skip:{queue_id}".encode())],
    ]

    try:
        if media_bytes and post.get('media_type'):
            is_doc = post['media_type'] == 'document'
            file_data = media_bytes if is_doc else _to_jpeg(media_bytes)
            msg = await bot.send_file(
                target, file_data, caption=caption[:1024],
                parse_mode='html', buttons=buttons,
                force_document=is_doc,
                file_name=(post.get('media_filename') or 'document') if is_doc else None,
                reply_to=original_msg_id,
            )
        else:
            msg = await bot.send_message(
                target, caption, parse_mode='html', buttons=buttons,
                reply_to=original_msg_id,
            )

        storage.update_moderation_queue(
            queue_id,
            edited_text=rewritten,
            bot_msg_id=msg.id,
            status='edited',
            edit_count=edit_count,
        )
        logger.info("Edited post #%d (edit_count=%d)", queue_id, edit_count)
    except Exception as e:
        logger.error("Failed to send edited msg #%d: %s", queue_id, e)
        await progress_msg.edit(
            f"❌ <b>Ошибка отправки:</b> {e}", parse_mode='html',
        )
        return

    # Clean up progress message
    try:
        await progress_msg.delete()
    except Exception:
        pass


async def _handle_reedit(event, bot, storage, post, queue_id, target):
    """Re-rewrite already edited text via Grok."""
    await _handle_edit(event, bot, storage, post, queue_id, target)


async def _handle_publish(event, bot, storage, post, queue_id, target):
    """Publish post to PUBLISH_CHANNEL_ID."""
    if not config.PUBLISH_CHANNEL_ID:
        await event.answer("❌ PUBLISH_CHANNEL_ID не настроен", alert=True)
        return

    await event.answer()
    progress_msg = await bot.send_message(
        target, "📤 <b>Публикую...</b>", parse_mode='html',
    )

    publish_to = int(config.PUBLISH_CHANNEL_ID)
    text = post.get('edited_text') or post.get('original_text') or ''

    # Download media from current bot message
    media_bytes = None
    if post.get('media_type') and post.get('bot_msg_id'):
        try:
            msgs = await bot.get_messages(target, ids=[post['bot_msg_id']])
            if msgs and msgs[0] and msgs[0].media:
                media_bytes = await msgs[0].download_media(bytes)
        except Exception as e:
            logger.warning("Failed to download media for publish #%d: %s", queue_id, e)

    try:
        if media_bytes and post.get('media_type'):
            is_doc = post['media_type'] == 'document'
            file_data = media_bytes if is_doc else _to_jpeg(media_bytes)
            await bot.send_file(
                publish_to, file_data, caption=text[:1024],
                parse_mode='html',
                force_document=is_doc,
                file_name=(post.get('media_filename') or 'document') if is_doc else None,
            )
        else:
            await bot.send_message(publish_to, text, parse_mode='html')

        logger.info("Published post #%d to channel %s", queue_id, config.PUBLISH_CHANNEL_ID)
    except Exception as e:
        logger.error("Failed to publish post #%d: %s", queue_id, e)
        await progress_msg.edit(
            f"❌ <b>Ошибка публикации:</b> {e}", parse_mode='html',
        )
        return

    # Replace buttons with "Published" marker (keep the post visible)
    try:
        if post.get('bot_msg_id'):
            await bot.edit_message(
                target, post['bot_msg_id'],
                buttons=[[Button.inline("Опубликовано", data=b"noop:0")]],
            )
    except Exception as e:
        logger.warning("Failed to update buttons after publish #%d: %s", queue_id, e)

    storage.update_moderation_queue(queue_id, status='published')
    logger.info("Post #%d published", queue_id)

    # Clean up progress message
    try:
        await progress_msg.delete()
    except Exception:
        pass
