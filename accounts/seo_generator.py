"""
SEO Article Auto-Generator.

Generates high-quality SEO articles about franchises using real data from the
database and Grok (xAI) API for content creation. Articles are created as
drafts for moderator review before publishing.

Article types:
1. top_category — "Топ-10 франшиз в категории X в 2026"
2. city_review — "Франшизы в городе X: обзор и сравнение"
3. franchise_deep_dive — "Франшиза X: стоимость, условия, окупаемость"
4. cost_overview — "Сколько стоит открыть франшизу в 2026"
5. budget_filter — "Лучшие франшизы до 500К рублей"
"""

import hashlib
import json
import logging
from datetime import datetime

import requests
from django.conf import settings
from django.db.models import Avg, Count, Min, Max
from django.utils import timezone

logger = logging.getLogger(__name__)

# Rotation order for article types
ROTATION = [
    'top_category',
    'city_review',
    'franchise_deep_dive',
    'cost_overview',
    'budget_filter',
]

BUDGET_TIERS = [500000, 1000000, 2000000, 3000000, 5000000]

SYSTEM_PROMPT = """Ты — SEO-редактор сайта GreatIdeas.ru, специализирующегося на франшизах.

ПРАВИЛА:
- Пиши на русском языке
- Используй ТОЛЬКО данные, которые предоставлены ниже. НЕ выдумывай франшизы, цифры или факты
- Пиши экспертным, но доступным языком (не "SEO-мусор", а полезный контент)
- Используй HTML-разметку: <h2>, <h3>, <p>, <ul>, <li>, <table>, <strong>
- Включай внутренние ссылки на страницы франшиз: <a href="/franchises/SLUG/">Название</a>
- Объём: 1500-2500 слов
- НЕ используй Markdown, только HTML

Верни ответ СТРОГО в JSON формате:
{
  "title": "Заголовок статьи (60-80 символов)",
  "content": "HTML-контент статьи",
  "tags": "тег1, тег2, тег3",
  "category": "slug категории (franchise, technology, finance, etc)",
  "meta_description": "Мета-описание для SEO (150-160 символов)"
}
"""


def _compute_hash(article_type, params):
    """Compute unique hash for article_type + params combination."""
    key = f"{article_type}:{json.dumps(params, sort_keys=True)}"
    return hashlib.sha256(key.encode()).hexdigest()


def _call_grok(prompt_content):
    """Synchronous call to Grok API."""
    api_key = getattr(settings, 'GROK_API_KEY', '')
    model = getattr(settings, 'GROK_MODEL', 'grok-3-mini')
    temperature = getattr(settings, 'GROK_SEO_TEMPERATURE', 0.5)

    if not api_key:
        logger.error("GROK_API_KEY not configured")
        return None

    proxy_url = getattr(settings, 'PROXY_URL', '')
    proxies = {}
    if proxy_url:
        proxies = {'http': proxy_url, 'https': proxy_url}

    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt_content},
                ],
                "temperature": temperature,
                "max_tokens": 8000,
            },
            proxies=proxies or None,
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]

        # Parse JSON from response (handle ```json blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return json.loads(content)

    except requests.RequestException as e:
        logger.error("Grok API request failed: %s", e)
        return None
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error("Failed to parse Grok response: %s", e)
        return None


def _is_used(article_type, params):
    """Check if this topic was already generated."""
    from .models import ArticleTopicLog
    h = _compute_hash(article_type, params)
    return ArticleTopicLog.objects.filter(param_hash=h).exists()


def _save_article(article_type, params, grok_response):
    """Create draft NewsArticle and log the topic."""
    from .models import NewsArticles, NewsCategories, ArticleTopicLog

    title = grok_response.get('title', '')[:255]
    content = grok_response.get('content', '')
    tags = grok_response.get('tags', '')[:255]
    category_slug = grok_response.get('category', '')

    if not title or not content:
        logger.error("Grok returned empty title or content")
        return None

    # Find category
    category = None
    if category_slug:
        category = NewsCategories.objects.filter(slug=category_slug).first()
        if not category:
            category = NewsCategories.objects.filter(name__icontains=category_slug).first()

    article = NewsArticles(
        title=title,
        content=content,
        tags=tags,
        status='draft',
        content_type='article',
        entity_focus='franchise',
        category=category,
        published_at=timezone.now(),
        updated_at=timezone.now(),
    )
    article.save()

    # Log topic
    ArticleTopicLog.objects.create(
        article_type=article_type,
        article_type_params=params,
        param_hash=_compute_hash(article_type, params),
        generated_article=article,
    )

    logger.info("SEO article draft created: '%s' (id=%d, type=%s)", title, article.article_id, article_type)
    return article


# ── Article Type Generators ──────────────────────────────────


def _generate_top_category():
    """Топ-N франшиз в категории X."""
    from .models import Franchises, Directions

    # Find direction with most franchises, not yet covered
    directions = Directions.objects.annotate(
        franchise_count=Count('franchises', filter=models.Q(franchises__status='approved'))
    ).filter(franchise_count__gte=3).order_by('-franchise_count')

    for d in directions:
        params = {"direction_id": d.direction_id}
        if _is_used('top_category', params):
            continue

        franchises = Franchises.objects.filter(
            status='approved', direction=d
        ).order_by('-sum_votes', '-created_at')[:10]

        data = {
            "direction": d.direction_name,
            "year": datetime.now().year,
            "franchises": [
                {
                    "title": f.title,
                    "short_description": (f.short_description or "")[:300],
                    "investment_size": float(f.investment_size) if f.investment_size else None,
                    "franchise_cost": float(f.franchise_cost) if f.franchise_cost else None,
                    "payback_period": f.payback_period,
                    "own_businesses_count": f.own_businesses_count,
                    "franchise_businesses_count": f.franchise_businesses_count,
                    "rating": round(f.get_average_rating(), 1),
                    "url": f"/franchises/{f.slug}/" if f.slug else f"/franchises/id/{f.franchise_id}/",
                }
                for f in franchises
            ],
        }

        prompt = (
            f"Напиши статью 'Топ-{len(data['franchises'])} франшиз в категории "
            f"{d.direction_name} в {data['year']} году'.\n\n"
            "Структура:\n"
            "- <h2>: Вступление — почему эта категория перспективна (2-3 абзаца)\n"
            "- Для каждой франшизы: <h3> с названием, описание, таблица инвестиций/стоимости/окупаемости\n"
            "- <h2>: Сравнительная таблица всех франшиз\n"
            "- <h2>: Выводы и рекомендации\n\n"
            f"Данные:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        )

        result = _call_grok(prompt)
        if result:
            return _save_article('top_category', params, result)

    return None


def _generate_city_review():
    """Франшизы в городе X: обзор."""
    from .models import City, FranchiseLocation

    cities = City.objects.filter(
        franchise_locations__status='active'
    ).annotate(
        loc_count=Count('franchise_locations', filter=models.Q(franchise_locations__status='active'))
    ).filter(loc_count__gte=3).order_by('-is_major', '-population')

    for city in cities:
        params = {"city_id": city.city_id}
        if _is_used('city_review', params):
            continue

        locations = FranchiseLocation.objects.filter(
            city=city, status='active'
        ).select_related('franchise', 'franchise__direction')

        data = {
            "city": city.name,
            "region": city.get_region_display() if city.region else "",
            "population": city.population,
            "year": datetime.now().year,
            "franchises": [
                {
                    "title": loc.franchise.title,
                    "direction": loc.franchise.direction.direction_name if loc.franchise.direction else "",
                    "investment_size": float(loc.franchise.investment_size) if loc.franchise.investment_size else None,
                    "franchise_cost": float(loc.franchise.franchise_cost) if loc.franchise.franchise_cost else None,
                    "monthly_profit": float(loc.monthly_profit) if loc.monthly_profit else None,
                    "initial_investment": float(loc.initial_investment) if loc.initial_investment else None,
                    "payback_months": loc.get_payback_months(),
                    "url": f"/franchises/{loc.franchise.slug}/" if loc.franchise.slug else "",
                }
                for loc in locations
            ],
        }

        prompt = (
            f"Напиши статью 'Франшизы в {city.name}: обзор и сравнение в {data['year']} году'.\n\n"
            "Структура:\n"
            f"- <h2>: Вступление — рынок франшиз в {city.name}, особенности региона\n"
            "- Для каждой франшизы: <h3> с названием, описание, финансовые показатели\n"
            "- <h2>: Сравнительная таблица\n"
            "- <h2>: Какую франшизу выбрать — рекомендации\n\n"
            f"Данные:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        )

        result = _call_grok(prompt)
        if result:
            return _save_article('city_review', params, result)

    return None


def _generate_franchise_deep_dive():
    """Подробный обзор конкретной франшизы."""
    from .models import Franchises, FranchiseLocation

    franchises = Franchises.objects.filter(
        status='approved',
        investment_size__isnull=False,
        description__isnull=False,
    ).exclude(description='').order_by('-sum_votes', '-created_at')

    for f in franchises:
        params = {"franchise_id": f.franchise_id}
        if _is_used('franchise_deep_dive', params):
            continue

        locations = FranchiseLocation.objects.filter(
            franchise=f, status='active'
        ).select_related('city')

        data = {
            "title": f.title,
            "description": (f.description or "")[:1000],
            "short_description": f.short_description or "",
            "terms": (f.terms or "")[:500],
            "investment_size": float(f.investment_size) if f.investment_size else None,
            "franchise_cost": float(f.franchise_cost) if f.franchise_cost else None,
            "payback_period": f.payback_period,
            "own_businesses_count": f.own_businesses_count,
            "franchise_businesses_count": f.franchise_businesses_count,
            "direction": f.direction.direction_name if f.direction else "",
            "rating": round(f.get_average_rating(), 1),
            "url": f"/franchises/{f.slug}/" if f.slug else "",
            "year": datetime.now().year,
            "cities": [
                {
                    "name": loc.city.name,
                    "monthly_profit": float(loc.monthly_profit) if loc.monthly_profit else None,
                    "initial_investment": float(loc.initial_investment) if loc.initial_investment else None,
                }
                for loc in locations[:10]
            ],
        }

        prompt = (
            f"Напиши подробную статью 'Франшиза {f.title}: стоимость, условия, окупаемость в {data['year']}'.\n\n"
            "Структура:\n"
            f"- <h2>: Что такое {f.title} — описание бизнеса\n"
            "- <h2>: Сколько стоит открыть — инвестиции, паушальный взнос, доп. расходы\n"
            "- <h2>: Условия сотрудничества\n"
            "- <h2>: Окупаемость и прибыльность\n"
            "- <h2>: География присутствия\n"
            "- <h2>: Плюсы и минусы (объективно)\n"
            "- <h2>: Выводы — кому подойдёт\n\n"
            f"Данные:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        )

        result = _call_grok(prompt)
        if result:
            return _save_article('franchise_deep_dive', params, result)

    return None


def _generate_cost_overview():
    """Обзор стоимости франшиз за текущий квартал."""
    from .models import Franchises

    year = datetime.now().year
    quarter = (datetime.now().month - 1) // 3 + 1
    params = {"year": year, "quarter": quarter}

    if _is_used('cost_overview', params):
        return None

    franchises = Franchises.objects.filter(
        status='approved', investment_size__isnull=False
    ).select_related('direction')

    if franchises.count() < 5:
        return None

    stats = franchises.aggregate(
        avg_investment=Avg('investment_size'),
        min_investment=Min('investment_size'),
        max_investment=Max('investment_size'),
        avg_franchise_cost=Avg('franchise_cost'),
        avg_payback=Avg('payback_period'),
        total_count=Count('franchise_id'),
    )

    per_direction = list(
        franchises.values('direction__direction_name').annotate(
            avg_inv=Avg('investment_size'),
            count=Count('franchise_id'),
            avg_payback=Avg('payback_period'),
        ).filter(count__gte=2).order_by('-count')
    )

    data = {
        "year": year,
        "quarter": quarter,
        "total_franchises": stats['total_count'],
        "avg_investment": float(stats['avg_investment']) if stats['avg_investment'] else 0,
        "min_investment": float(stats['min_investment']) if stats['min_investment'] else 0,
        "max_investment": float(stats['max_investment']) if stats['max_investment'] else 0,
        "avg_franchise_cost": float(stats['avg_franchise_cost']) if stats['avg_franchise_cost'] else 0,
        "avg_payback_months": int(stats['avg_payback']) if stats['avg_payback'] else None,
        "by_category": [
            {
                "category": item['direction__direction_name'] or "Другое",
                "avg_investment": float(item['avg_inv']),
                "count": item['count'],
                "avg_payback": int(item['avg_payback']) if item['avg_payback'] else None,
            }
            for item in per_direction
        ],
    }

    prompt = (
        f"Напиши статью 'Сколько стоит открыть франшизу в {year} году: полный обзор (Q{quarter})'.\n\n"
        "Структура:\n"
        f"- <h2>: Обзор рынка франшиз в {year} году\n"
        "- <h2>: Средняя стоимость открытия франшизы\n"
        "- <h2>: Стоимость по категориям (таблица)\n"
        "- <h2>: Паушальный взнос — что входит\n"
        "- <h2>: Сроки окупаемости\n"
        "- <h2>: Как выбрать франшизу по бюджету — рекомендации\n\n"
        f"Данные:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
    )

    result = _call_grok(prompt)
    if result:
        return _save_article('cost_overview', params, result)
    return None


def _generate_budget_filter():
    """Лучшие франшизы до X рублей."""
    from .models import Franchises

    for tier in BUDGET_TIERS:
        params = {"max_investment": tier}
        if _is_used('budget_filter', params):
            continue

        franchises = Franchises.objects.filter(
            status='approved',
            investment_size__lte=tier,
            investment_size__isnull=False,
        ).select_related('direction').order_by('investment_size')[:15]

        if franchises.count() < 5:
            continue

        tier_label = f"{tier // 1000}К" if tier < 1000000 else f"{tier // 1000000}М"

        data = {
            "max_investment": tier,
            "max_investment_label": tier_label,
            "year": datetime.now().year,
            "franchises": [
                {
                    "title": f.title,
                    "direction": f.direction.direction_name if f.direction else "",
                    "investment_size": float(f.investment_size),
                    "franchise_cost": float(f.franchise_cost) if f.franchise_cost else None,
                    "payback_period": f.payback_period,
                    "rating": round(f.get_average_rating(), 1),
                    "url": f"/franchises/{f.slug}/" if f.slug else "",
                }
                for f in franchises
            ],
        }

        prompt = (
            f"Напиши статью 'Лучшие франшизы до {tier_label} рублей в {data['year']} году'.\n\n"
            "Структура:\n"
            f"- <h2>: Вступление — можно ли открыть прибыльную франшизу до {tier_label} рублей\n"
            "- Для каждой франшизы: <h3>, краткое описание, стоимость, окупаемость\n"
            "- <h2>: Сравнительная таблица\n"
            "- <h2>: На что обращать внимание при выборе бюджетной франшизы\n"
            "- <h2>: Выводы\n\n"
            f"Данные:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        )

        result = _call_grok(prompt)
        if result:
            return _save_article('budget_filter', params, result)

    return None


# ── Main Generator ───────────────────────────────────────────

# Need to import models at module level for Q objects
from django.db import models

GENERATORS = {
    'top_category': _generate_top_category,
    'city_review': _generate_city_review,
    'franchise_deep_dive': _generate_franchise_deep_dive,
    'cost_overview': _generate_cost_overview,
    'budget_filter': _generate_budget_filter,
}


class SEOArticleGenerator:
    """Orchestrates SEO article generation with topic rotation."""

    def generate(self):
        """Select next topic type and generate an article. Returns NewsArticles or None."""
        from .models import ArticleTopicLog

        # Find least-recently-used article type
        type_last_used = {}
        for t in ROTATION:
            last = ArticleTopicLog.objects.filter(article_type=t).order_by('-created_at').first()
            type_last_used[t] = last.created_at if last else timezone.make_aware(datetime(2000, 1, 1))

        sorted_types = sorted(ROTATION, key=lambda t: type_last_used[t])

        for article_type in sorted_types:
            generator = GENERATORS.get(article_type)
            if not generator:
                continue

            logger.info("Attempting to generate SEO article type: %s", article_type)
            try:
                article = generator()
                if article:
                    return article
                logger.info("No available topics for type: %s, trying next", article_type)
            except Exception as e:
                logger.error("Error generating %s article: %s", article_type, e, exc_info=True)

        logger.warning("All SEO article types exhausted — no article generated")
        return None
