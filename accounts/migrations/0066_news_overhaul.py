"""
News/Blog system overhaul:
- Create news_categories, news_comments, news_dislikes tables
- Extend news_articles with slug, status, category, is_featured, scheduled_at
- Seed initial categories
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0065_migrate_planet_images_to_new_textures"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
-- 1. Create news_categories table
CREATE TABLE IF NOT EXISTS news_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Seed initial categories
INSERT INTO news_categories (name, slug, sort_order) VALUES
    ('Медицина', 'medicine', 1),
    ('Автомобили', 'auto', 2),
    ('Доставка', 'delivery', 3),
    ('Кафе/рестораны', 'cafe', 4),
    ('Фастфуд', 'fastfood', 5),
    ('Здоровье', 'health', 6),
    ('Красота', 'beauty', 7),
    ('Транспорт', 'transport', 8),
    ('Спорт', 'sport', 9),
    ('Психология', 'psychology', 10),
    ('ИИ', 'ai', 11),
    ('Технологии', 'technology', 12),
    ('Финансы', 'finance', 13),
    ('Образование', 'education', 14)
ON CONFLICT (name) DO NOTHING;

-- 2. Create news_comments table
CREATE TABLE IF NOT EXISTS news_comments (
    comment_id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES news_articles(article_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_rating INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_comment_id INTEGER REFERENCES news_comments(comment_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_newscomments_article_parent
    ON news_comments (article_id, parent_comment_id, created_at DESC);

-- 3. Create news_dislikes table
CREATE TABLE IF NOT EXISTS news_dislikes (
    dislike_id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES news_articles(article_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- 4. Extend news_articles with new columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'slug') THEN
        ALTER TABLE news_articles ADD COLUMN slug VARCHAR(280) UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'status') THEN
        ALTER TABLE news_articles ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'published';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'category_id') THEN
        ALTER TABLE news_articles ADD COLUMN category_id INTEGER REFERENCES news_categories(category_id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'is_featured') THEN
        ALTER TABLE news_articles ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'scheduled_at') THEN
        ALTER TABLE news_articles ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;
END $$;

-- Backfill slugs for existing articles
UPDATE news_articles SET slug = 'article-' || article_id WHERE slug IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_status_pub ON news_articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles (category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON news_articles (is_featured, published_at DESC) WHERE is_featured = TRUE;
            """,
            reverse_sql="""
DROP INDEX IF EXISTS idx_news_articles_featured;
DROP INDEX IF EXISTS idx_news_articles_category;
DROP INDEX IF EXISTS idx_news_articles_status_pub;

ALTER TABLE news_articles DROP COLUMN IF EXISTS scheduled_at;
ALTER TABLE news_articles DROP COLUMN IF EXISTS is_featured;
ALTER TABLE news_articles DROP COLUMN IF EXISTS category_id;
ALTER TABLE news_articles DROP COLUMN IF EXISTS status;
ALTER TABLE news_articles DROP COLUMN IF EXISTS slug;

DROP TABLE IF EXISTS news_dislikes;
DROP TABLE IF EXISTS news_comments;
DROP TABLE IF EXISTS news_categories;
            """,
        ),
    ]
