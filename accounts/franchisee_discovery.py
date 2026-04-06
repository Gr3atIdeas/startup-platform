"""
Franchisee Discovery — автоматический поиск контактов франчайзи.

Парсит сайт франшизы, ищет в вебе и на картах, извлекает контакты через Grok AI.
Используется модераторами для сбора верифицированных отзывов.
"""
import json
import logging
import re
import time
from urllib.parse import urljoin, urlparse

import requests as http_requests
from django.conf import settings
from django.db import IntegrityError
from django.utils import timezone

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.5",
}

# Паттерны ссылок, где обычно живут контакты точек
_LOCATION_LINK_PATTERNS = re.compile(
    r"(контакт|contact|адрес|address|точ[кеи]|location|"
    r"наш[иа]\s*(точ|магаз|филиал|салон|офис)|"
    r"где\s*купить|franch|партн[её]р|franchis|"
    r"город|geograph|карта|map|our.*(location|store|office))",
    re.IGNORECASE,
)


def _get_proxies():
    proxy_url = getattr(settings, "PROXY_URL", "")
    return {"http": proxy_url, "https": proxy_url} if proxy_url else None


def _fetch_page(url, timeout=15):
    """Fetch a URL and return BeautifulSoup object + raw text."""
    try:
        from bs4 import BeautifulSoup

        resp = http_requests.get(
            url, headers=_HEADERS, timeout=timeout, proxies=_get_proxies()
        )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return soup, text[:15000]

    except Exception as e:
        logger.warning("Failed to fetch %s: %s", url, e)
        return None, ""


# ── Stage 1: Website Scraping ──────────────────────────────────


def scrape_franchise_website(franchise):
    """Scrape franchise website for franchisee/location pages."""
    results = []
    base_url = (franchise.contact_website or "").strip()
    if not base_url:
        logger.info("Franchise %s has no website", franchise.title)
        return results

    if not base_url.startswith("http"):
        base_url = "https://" + base_url

    # Fetch homepage
    soup, homepage_text = _fetch_page(base_url)
    if not soup:
        return results

    results.append({
        "url": base_url,
        "text": homepage_text,
        "source": "website",
    })

    # Find relevant subpages
    found_urls = set()
    for link in soup.find_all("a", href=True):
        href = link.get("href", "")
        link_text = link.get_text(strip=True).lower()
        href_lower = href.lower()

        if _LOCATION_LINK_PATTERNS.search(link_text) or _LOCATION_LINK_PATTERNS.search(href_lower):
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            base_domain = urlparse(base_url).netloc

            if parsed.netloc == base_domain and full_url not in found_urls:
                found_urls.add(full_url)

    # Scrape subpages (max 5, with rate limiting)
    for sub_url in list(found_urls)[:5]:
        time.sleep(2)
        _, sub_text = _fetch_page(sub_url)
        if sub_text:
            results.append({
                "url": sub_url,
                "text": sub_text,
                "source": "website",
            })

    return results


# ── Stage 2: Web Search ────────────────────────────────────────


def search_web_for_franchisees(franchise_title):
    """Search the web for franchisee contacts."""
    results = []
    queries = [
        f'"{franchise_title}" франчайзи контакты телефон',
        f'"{franchise_title}" точки адреса город отзывы',
    ]

    for query in queries:
        urls = _yandex_search(query)
        for url in urls[:3]:
            time.sleep(2)
            _, text = _fetch_page(url)
            if text and len(text) > 200:
                results.append({
                    "url": url,
                    "text": text,
                    "source": "web_search",
                })

    return results


def _yandex_search(query):
    """Search Yandex and extract result URLs. Best-effort scraping."""
    try:
        from bs4 import BeautifulSoup

        search_url = "https://yandex.ru/search/"
        params = {"text": query, "lr": 213}
        resp = http_requests.get(
            search_url, params=params, headers=_HEADERS,
            timeout=15, proxies=_get_proxies(),
        )
        if resp.status_code != 200:
            logger.warning("Yandex search returned %s", resp.status_code)
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        urls = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if href.startswith("http") and "yandex" not in href and "ya.ru" not in href:
                parsed = urlparse(href)
                if parsed.scheme in ("http", "https") and parsed.netloc:
                    urls.append(href)

        # Deduplicate preserving order
        seen = set()
        unique = []
        for u in urls:
            domain = urlparse(u).netloc
            if domain not in seen:
                seen.add(domain)
                unique.append(u)

        return unique[:5]

    except Exception as e:
        logger.warning("Yandex search failed: %s", e)
        return []


# ── Stage 3: Maps ──────────────────────────────────────────────


def search_maps_for_locations(franchise_title):
    """Best-effort search on 2GIS for franchise locations."""
    results = []

    try:
        from bs4 import BeautifulSoup

        url = f"https://2gis.ru/search/{franchise_title}"
        resp = http_requests.get(
            url, headers=_HEADERS, timeout=15, proxies=_get_proxies(),
        )
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            for tag in soup(["script", "style", "nav"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            text = re.sub(r"\n{3,}", "\n\n", text)
            if len(text) > 300:
                results.append({
                    "url": url,
                    "text": text[:15000],
                    "source": "2gis",
                })
    except Exception as e:
        logger.warning("2GIS search failed: %s", e)

    return results


# ── Stage 4: AI Extraction ─────────────────────────────────────


FRANCHISEE_EXTRACTION_PROMPT = """Ты — система извлечения контактных данных франчайзи для платформы GreatIdeas.ru.

ЗАДАЧА: Из предоставленного текста извлеки контакты ФРАНЧАЙЗИ (партнёров, владельцев точек) франшизы "{franchise_title}".

ВАЖНО:
- Ищи контакты КОНКРЕТНЫХ ТОЧЕК и их владельцев, а НЕ головного офиса франшизы
- НЕ ВЫДУМЫВАЙ данные. Если информации нет — не добавляй
- Телефоны должны содержать код города/оператора
- Если один контакт относится к нескольким точкам — создай отдельную запись для каждой

Верни СТРОГО JSON (без markdown-обёртки):
{{
  "contacts": [
    {{
      "person_name": "ФИО владельца/менеджера точки или null",
      "company_name": "Название юрлица/точки или null",
      "phone": "Телефон с кодом или null",
      "email": "Email или null",
      "telegram": "Telegram-контакт или null",
      "website": "Сайт точки (не головной) или null",
      "city": "Город или null",
      "address": "Полный адрес или null",
      "confidence": "high/medium/low",
      "source_hint": "Откуда извлечены данные"
    }}
  ],
  "head_office_contacts": {{
    "phone": "Телефон головного офиса если найден или null",
    "email": "Email головного офиса или null"
  }},
  "notes": "Заметки о качестве данных"
}}"""


def extract_franchisee_contacts(all_text, franchise_title):
    """Send combined text to Grok AI for franchisee contact extraction."""
    api_key = getattr(settings, "GROK_API_KEY", "")
    model = getattr(settings, "GROK_MODEL", "grok-3-mini")

    if not api_key:
        logger.error("GROK_API_KEY not configured")
        return None

    if len(all_text) > 25000:
        all_text = all_text[:25000] + "\n\n[...текст обрезан...]"

    prompt = FRANCHISEE_EXTRACTION_PROMPT.format(franchise_title=franchise_title)

    try:
        response = http_requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Найди контакты франчайзи из текста:\n\n{all_text}"},
                ],
                "temperature": 0.1,
                "max_tokens": 6000,
            },
            proxies=_get_proxies() or None,
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return json.loads(content)

    except http_requests.RequestException as e:
        logger.error("Grok franchisee extraction API error: %s", e)
        return None
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error("Failed to parse Grok franchisee response: %s", e)
        return None


# ── Contact Saving ─────────────────────────────────────────────


def save_contact(franchise, analysis_log, contact_data):
    """Save a single extracted contact with deduplication."""
    from .models import FranchiseeContact

    phone = (contact_data.get("phone") or "").strip()
    email = (contact_data.get("email") or "").strip()

    if not phone and not email and not contact_data.get("address"):
        return None  # Skip contacts with no useful data

    # Try to find existing by phone or email
    existing = None
    if phone:
        existing = FranchiseeContact.objects.filter(franchise=franchise, phone=phone).first()
    if not existing and email:
        existing = FranchiseeContact.objects.filter(franchise=franchise, email=email).first()

    if existing:
        # Update empty fields only
        updated = False
        for field, value in [
            ("person_name", contact_data.get("person_name")),
            ("company_name", contact_data.get("company_name")),
            ("phone", phone),
            ("email", email),
            ("telegram", contact_data.get("telegram")),
            ("city", contact_data.get("city")),
            ("address", contact_data.get("address")),
        ]:
            if value and not getattr(existing, field, ""):
                setattr(existing, field, value)
                updated = True
        if updated:
            existing.save()
        return existing

    try:
        contact = FranchiseeContact.objects.create(
            franchise=franchise,
            analysis_log=analysis_log,
            person_name=(contact_data.get("person_name") or "")[:255],
            company_name=(contact_data.get("company_name") or "")[:255],
            phone=phone[:100],
            email=email[:255],
            telegram=(contact_data.get("telegram") or "")[:255],
            website=(contact_data.get("website") or "")[:500],
            city=(contact_data.get("city") or "")[:255],
            address=contact_data.get("address") or "",
            source=_map_source(contact_data.get("source_hint", "")),
            source_url=(contact_data.get("source_hint") or "")[:500] if "http" in (contact_data.get("source_hint") or "") else "",
            confidence=(contact_data.get("confidence") or "medium")[:20],
        )
        return contact
    except IntegrityError:
        logger.warning("Duplicate contact for franchise %s: %s / %s", franchise.franchise_id, phone, email)
        return None


def _map_source(source_hint):
    """Map AI source hint to SOURCE_CHOICES value."""
    hint = (source_hint or "").lower()
    if "2gis" in hint or "2гис" in hint:
        return "2gis"
    if "yandex" in hint or "яндекс" in hint:
        return "yandex_maps"
    if "search" in hint or "поиск" in hint:
        return "web_search"
    return "website"
