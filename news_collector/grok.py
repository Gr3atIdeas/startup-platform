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


def get_effective_prompt(storage) -> str:
    """Return the custom prompt from DB, or the default hardcoded one."""
    try:
        custom = storage.get_setting("grok_prompt")
        if custom and custom.strip():
            return custom
    except Exception:
        pass
    return SYSTEM_PROMPT


async def rewrite_news(text: str, system_prompt: str = "") -> str:
    """Send text to Grok API for rewriting. Returns rewritten text or raises GrokError."""
    if not config.GROK_API_KEY:
        raise GrokError("GROK_API_KEY не задан")

    prompt = system_prompt or SYSTEM_PROMPT
    headers = {
        "Authorization": f"Bearer {config.GROK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": config.GROK_MODEL,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": text},
        ],
        "temperature": 0.7,
    }

    last_err = None
    for attempt in range(1, 4):  # up to 3 attempts
        try:
            connector = None
            if config.PROXY_URL:
                from aiohttp_socks import ProxyConnector
                connector = ProxyConnector.from_url(config.PROXY_URL)
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.post(API_URL, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                    if resp.status != 200:
                        body = await resp.text()
                        logger.error("Grok API error %d: %s", resp.status, body[:300])
                        raise GrokError(f"API {resp.status}: {body[:200]}")
                    data = await resp.json()
                    result = data["choices"][0]["message"]["content"].strip()
                    logger.info("Grok API OK (attempt %d): input %d chars → output %d chars", attempt, len(text), len(result))
                    return result
        except GrokError:
            raise
        except Exception as e:
            last_err = e
            logger.warning("Grok API attempt %d failed: %s (%s)", attempt, e, type(e).__name__)
            if attempt < 3:
                import asyncio
                await asyncio.sleep(2)

    logger.error("Grok API all 3 attempts failed: %s", last_err)
    raise GrokError(f"Ошибка запроса (3 попытки): {type(last_err).__name__}: {last_err}")
