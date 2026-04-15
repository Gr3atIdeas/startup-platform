# Content Pipeline

SEO-статьи для блога GreatIdeas.ru.

## Структура статьи

Каждая статья — JSON-файл в `articles/`. Формат имени: `001_slug-name.json`

```json
{
  "title": "Заголовок (до 255 символов)",
  "content": "<h2>...</h2><p>HTML-контент статьи</p>",
  "tags": "тег1, тег2, тег3",
  "category_slug": "franchise",
  "content_type": "article",
  "entity_focus": "franchise",
  "image_url": "",
  "meta_description": "SEO мета-описание (150-160 символов)"
}
```

## Категории (slug)

medicine, auto, delivery, cafe, fastfood, health, beauty,
transport, sport, psychology, ai, technology, finance, education

## Публикация

```bash
# Опубликовать следующую готовую статью
python manage.py publish_article

# Посмотреть что будет опубликовано (без записи в БД)
python manage.py publish_article --dry-run

# Опубликовать конкретную статью
python manage.py publish_article --file 001_top-franshiz.json
```

## Расписание

Скрипт публикует одну статью за запуск. Настрой cron на сервере:
```
0 10 */3 * * cd /app && python manage.py publish_article
```
(каждые 3 дня в 10:00)
