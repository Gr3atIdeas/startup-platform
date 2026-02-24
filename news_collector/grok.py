"""Async client for xAI (Grok) API — news rewriting."""

import logging

import aiohttp

import config

logger = logging.getLogger(__name__)

API_URL = "https://api.x.ai/v1/chat/completions"

SYSTEM_PROMPT = (
    "Ты — редактор новостного Telegram-канала про стартапы и бизнес. "
    "Перепиши новость:\n"
    "- Сохрани все факты, цифры и имена.\n"
    "- Убери рекламу, ссылки, призывы подписаться.\n"
    "- Пиши кратко, по делу, для бизнес-аудитории.\n"
    "- Используй нейтральный деловой тон.\n"
    "- Не добавляй от себя информацию.\n"
    "- Верни ТОЛЬКО текст новости, без пояснений."
)


class GrokError(Exception):
    """Raised when Grok API call fails."""
    pass


async def rewrite_news(text: str) -> str:
    """Send text to Grok API for rewriting. Returns rewritten text or raises GrokError."""
    if not config.GROK_API_KEY:
        raise GrokError("GROK_API_KEY не задан")

    headers = {
        "Authorization": f"Bearer {config.GROK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": config.GROK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        "temperature": 0.7,
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(API_URL, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status != 200:
                    body = await resp.text()
                    logger.error("Grok API error %d: %s", resp.status, body[:300])
                    raise GrokError(f"API {resp.status}: {body[:200]}")
                data = await resp.json()
                return data["choices"][0]["message"]["content"].strip()
    except GrokError:
        raise
    except Exception as e:
        logger.error("Grok API request failed: %s", e)
        raise GrokError(f"Ошибка запроса: {e}")
