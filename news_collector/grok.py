"""Async client for xAI (Grok) API — news rewriting & SEO article generation."""

import json
import logging

import aiohttp

import config

logger = logging.getLogger(__name__)

API_URL = "https://api.x.ai/v1/chat/completions"

SYSTEM_PROMPT = (
    "Ты — главный редактор новостного Telegram-канала Great Ideas про стартапы и бизнес.\n"
    "Твоя задача — ПЕРЕПИСАТЬ новость СВОИМИ СЛОВАМИ. Не копируй оригинал!\n\n"
    "Правила:\n"
    "1. Перефразируй каждое предложение — используй другие формулировки и структуру.\n"
    "2. Сохрани ВСЕ факты, цифры, имена и даты без искажений.\n"
    "3. Убери рекламу, ссылки, упоминания каналов, призывы подписаться.\n"
    "4. Пиши живым деловым языком, не сухо — как журналист, а не робот.\n"
    "5. Добавь цепляющее первое предложение, которое привлечёт внимание.\n"
    "6. Используй HTML-форматирование: <b>жирный</b> для ключевых цифр и имён.\n"
    "7. Объём: 2-4 абзаца, не длиннее оригинала.\n"
    "8. Верни ТОЛЬКО готовый текст поста, без пояснений и комментариев."
)

SEO_ARTICLE_PROMPT = """Ты — SEO-редактор новостного сайта про стартапы и бизнес.
На основе текста новости создай полноценную SEO-оптимизированную статью для сайта.

Верни ответ СТРОГО в JSON формате (без markdown-блоков, только чистый JSON):
{
  "title": "SEO-заголовок статьи (до 80 символов, с ключевыми словами)",
  "content": "Полный HTML-текст статьи. Используй теги <h2>, <h3> для подзаголовков, <p> для абзацев, <strong> для выделения, <ul>/<li> для списков. Минимум 3-4 абзаца. Текст должен быть уникальным, информативным и SEO-оптимизированным.",
  "tags": "ключевое слово 1, ключевое слово 2, ключевое слово 3",
  "category": "одна из: medicine, auto, delivery, cafe, fastfood, health, beauty, transport, sport, psychology, ai, technology, finance, education"
}

Правила:
- Заголовок должен содержать ключевые слова и привлекать внимание.
- Контент: расширь новость, добавь контекст и анализ, но не выдумывай факты.
- Используй HTML-разметку для структуры (h2, h3, p, strong, ul/li).
- Теги: 3-5 релевантных ключевых слов через запятую.
- Категория: выбери ОДНУ наиболее подходящую из списка.
- Верни ТОЛЬКО валидный JSON, без пояснений и markdown."""


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


async def generate_seo_article(text: str) -> dict:
    """Generate SEO-optimized article from news text.

    Returns dict with keys: title, content, tags, category.
    Raises GrokError on failure.
    """
    raw = await rewrite_news(text, system_prompt=SEO_ARTICLE_PROMPT)

    # Strip markdown code block wrappers if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Remove ```json ... ``` or ``` ... ```
        lines = cleaned.split("\n")
        lines = lines[1:]  # drop opening ```json
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Grok SEO: invalid JSON response: %s\nRaw: %s", e, raw[:500])
        raise GrokError(f"Grok вернул невалидный JSON: {e}")

    required = ("title", "content", "tags", "category")
    missing = [k for k in required if k not in data]
    if missing:
        raise GrokError(f"Grok JSON missing keys: {missing}")

    logger.info("SEO article generated: title=%r, category=%s, tags=%s",
                data["title"][:60], data["category"], data["tags"][:60])
    return data
