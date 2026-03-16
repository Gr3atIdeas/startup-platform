import logging
from datetime import datetime, timedelta
from urllib.parse import urlparse

import psycopg2

import config

logger = logging.getLogger(__name__)

# Table prefix to avoid conflicts with Django tables
_P = "news_"


def _parse_database_url(url: str) -> dict:
    """Parse DATABASE_URL into psycopg2 connect kwargs."""
    parsed = urlparse(url)
    return {
        "host": parsed.hostname,
        "port": parsed.port or 5432,
        "dbname": parsed.path.lstrip("/"),
        "user": parsed.username,
        "password": parsed.password,
    }


class PostStorage:
    def __init__(self, database_url: str = ""):
        db_url = database_url or config.DATABASE_URL
        if not db_url:
            raise ValueError("DATABASE_URL is required for PostStorage")
        self.conn = psycopg2.connect(**_parse_database_url(db_url))
        self.conn.autocommit = True
        self._create_tables()
        logger.info("Storage initialized (PostgreSQL)")

    def _create_tables(self):
        with self.conn.cursor() as cur:
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {_P}processed_posts (
                    channel_id TEXT NOT NULL,
                    message_id BIGINT NOT NULL,
                    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    PRIMARY KEY (channel_id, message_id)
                )
            """)
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {_P}dynamic_channels (
                    channel TEXT PRIMARY KEY,
                    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {_P}dynamic_keywords (
                    keyword TEXT PRIMARY KEY,
                    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {_P}spam_words (
                    word TEXT PRIMARY KEY,
                    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {_P}moderation_queue (
                    id              SERIAL PRIMARY KEY,
                    source_channel  TEXT NOT NULL,
                    source_msg_id   BIGINT,
                    original_text   TEXT DEFAULT '',
                    edited_text     TEXT DEFAULT '',
                    media_type      TEXT DEFAULT '',
                    media_file_id   TEXT DEFAULT '',
                    media_filename  TEXT DEFAULT '',
                    bot_msg_id      BIGINT,
                    status          TEXT NOT NULL DEFAULT 'pending',
                    edit_count      INTEGER DEFAULT 0,
                    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)

            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {_P}settings (
                    key        TEXT PRIMARY KEY,
                    value      TEXT NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)

            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {_P}entity_notifications (
                    id          SERIAL PRIMARY KEY,
                    entity_type TEXT NOT NULL,
                    entity_id   INTEGER NOT NULL,
                    queue_id    INTEGER NOT NULL,
                    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE(entity_type, entity_id)
                )
            """)

    # ── processed posts ───────────────────────────────────────────────

    def is_processed(self, channel_id: str, message_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                f"SELECT 1 FROM {_P}processed_posts WHERE channel_id = %s AND message_id = %s",
                (str(channel_id), message_id),
            )
            return cur.fetchone() is not None

    def mark_processed(self, channel_id: str, message_id: int):
        with self.conn.cursor() as cur:
            cur.execute(
                f"""INSERT INTO {_P}processed_posts (channel_id, message_id, processed_at)
                    VALUES (%s, %s, %s) ON CONFLICT DO NOTHING""",
                (str(channel_id), message_id, datetime.utcnow()),
            )

    def cleanup(self, days: int = 30):
        cutoff = datetime.utcnow() - timedelta(days=days)
        with self.conn.cursor() as cur:
            cur.execute(
                f"DELETE FROM {_P}processed_posts WHERE processed_at < %s", (cutoff,)
            )
            if cur.rowcount > 0:
                logger.info("Cleaned up %d old records", cur.rowcount)

    def get_processed_count(self) -> int:
        with self.conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {_P}processed_posts")
            return cur.fetchone()[0]

    # ── dynamic channels ──────────────────────────────────────────────

    def get_channels(self) -> list:
        with self.conn.cursor() as cur:
            cur.execute(f"SELECT channel FROM {_P}dynamic_channels ORDER BY added_at")
            rows = cur.fetchall()
        result = []
        for (ch,) in rows:
            try:
                result.append(int(ch))
            except ValueError:
                result.append(ch)
        return result

    def add_channel(self, channel) -> bool:
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {_P}dynamic_channels (channel, added_at)
                        VALUES (%s, %s) ON CONFLICT DO NOTHING""",
                    (str(channel), datetime.utcnow()),
                )
                return cur.rowcount > 0
        except Exception as e:
            logger.error("Failed to add channel %s: %s", channel, e)
            return False

    def remove_channel(self, channel) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                f"DELETE FROM {_P}dynamic_channels WHERE channel = %s", (str(channel),)
            )
            return cur.rowcount > 0

    # ── dynamic keywords ──────────────────────────────────────────────

    def get_keywords(self) -> list[str]:
        with self.conn.cursor() as cur:
            cur.execute(f"SELECT keyword FROM {_P}dynamic_keywords ORDER BY added_at")
            return [row[0] for row in cur.fetchall()]

    def add_keyword(self, keyword: str) -> bool:
        kw = keyword.strip().lower()
        if not kw:
            return False
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {_P}dynamic_keywords (keyword, added_at)
                        VALUES (%s, %s) ON CONFLICT DO NOTHING""",
                    (kw, datetime.utcnow()),
                )
                return True
        except Exception as e:
            logger.error("Failed to add keyword %s: %s", kw, e)
            return False

    def remove_keyword(self, keyword: str) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                f"DELETE FROM {_P}dynamic_keywords WHERE keyword = %s",
                (keyword.strip().lower(),),
            )
            return cur.rowcount > 0

    # ── spam words ────────────────────────────────────────────────────

    def get_spam_words(self) -> list[str]:
        with self.conn.cursor() as cur:
            cur.execute(f"SELECT word FROM {_P}spam_words ORDER BY added_at")
            return [row[0] for row in cur.fetchall()]

    def add_spam_word(self, word: str) -> bool:
        w = word.strip().lower()
        if not w:
            return False
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {_P}spam_words (word, added_at)
                        VALUES (%s, %s) ON CONFLICT DO NOTHING""",
                    (w, datetime.utcnow()),
                )
                return True
        except Exception as e:
            logger.error("Failed to add spam word %s: %s", w, e)
            return False

    def remove_spam_word(self, word: str) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                f"DELETE FROM {_P}spam_words WHERE word = %s",
                (word.strip().lower(),),
            )
            return cur.rowcount > 0

    # ── moderation queue ──────────────────────────────────────────────

    def add_to_moderation_queue(self, source_channel: str, original_text: str,
                                media_type: str = '', media_filename: str = '',
                                source_msg_id: int = None) -> int:
        now = datetime.utcnow()
        with self.conn.cursor() as cur:
            cur.execute(
                f"""INSERT INTO {_P}moderation_queue
                    (source_channel, source_msg_id, original_text, media_type, media_filename,
                     status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s)
                    RETURNING id""",
                (source_channel, source_msg_id, original_text, media_type, media_filename, now, now),
            )
            return cur.fetchone()[0]

    def get_moderation_post(self, queue_id: int) -> dict | None:
        with self.conn.cursor() as cur:
            cur.execute(
                f"SELECT * FROM {_P}moderation_queue WHERE id = %s", (queue_id,)
            )
            row = cur.fetchone()
            if not row:
                return None
            columns = [desc[0] for desc in cur.description]
            return dict(zip(columns, row))

    def update_moderation_queue(self, queue_id: int, **kwargs):
        kwargs['updated_at'] = datetime.utcnow()
        set_clause = ", ".join(f"{k} = %s" for k in kwargs)
        values = list(kwargs.values()) + [queue_id]
        with self.conn.cursor() as cur:
            cur.execute(
                f"UPDATE {_P}moderation_queue SET {set_clause} WHERE id = %s", values
            )

    def get_pending_moderation_count(self) -> int:
        with self.conn.cursor() as cur:
            cur.execute(
                f"SELECT COUNT(*) FROM {_P}moderation_queue WHERE status IN ('sent', 'edited')"
            )
            return cur.fetchone()[0]

    # ── settings (key-value) ─────────────────────────────────────────

    def get_setting(self, key: str) -> str | None:
        with self.conn.cursor() as cur:
            cur.execute(
                f"SELECT value FROM {_P}settings WHERE key = %s", (key,)
            )
            row = cur.fetchone()
            return row[0] if row else None

    def set_setting(self, key: str, value: str):
        now = datetime.utcnow()
        with self.conn.cursor() as cur:
            cur.execute(
                f"""INSERT INTO {_P}settings (key, value, updated_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at""",
                (key, value, now),
            )

    # ── entity notifications ───────────────────────────────────────────

    def is_entity_notified(self, entity_type: str, entity_id: int) -> bool:
        with self.conn.cursor() as cur:
            cur.execute(
                f"SELECT 1 FROM {_P}entity_notifications WHERE entity_type = %s AND entity_id = %s",
                (entity_type, entity_id),
            )
            return cur.fetchone() is not None

    def mark_entity_notified(self, entity_type: str, entity_id: int, queue_id: int):
        with self.conn.cursor() as cur:
            cur.execute(
                f"""INSERT INTO {_P}entity_notifications (entity_type, entity_id, queue_id)
                    VALUES (%s, %s, %s) ON CONFLICT (entity_type, entity_id) DO NOTHING""",
                (entity_type, entity_id, queue_id),
            )

    def get_pending_bot_posts(self) -> list[dict]:
        with self.conn.cursor() as cur:
            cur.execute(
                f"SELECT * FROM {_P}moderation_queue WHERE status = 'pending_bot' ORDER BY id"
            )
            rows = cur.fetchall()
            if not rows:
                return []
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in rows]

    # ── news articles (website) ──────────────────────────────────────

    def create_news_article(self, title: str, content: str, tags: str = '',
                            category_slug: str = '', image_url: str = '',
                            source_queue_id: int = None) -> int | None:
        """Insert a published article into news_articles table (Django site).

        Returns article_id or None on failure.
        """
        import re
        import uuid as _uuid

        # Simple slug generation (no Django dependency)
        slug_base = title.lower().strip()
        slug_base = re.sub(r'[^\w\s-]', '', slug_base)
        slug_base = re.sub(r'[\s_]+', '-', slug_base).strip('-')[:250]
        if not slug_base:
            slug_base = "article"
        slug = f"{slug_base}-{_uuid.uuid4().hex[:8]}"

        now = datetime.utcnow()

        # Resolve category_id from slug
        category_id = None
        if category_slug:
            try:
                with self.conn.cursor() as cur:
                    cur.execute(
                        "SELECT category_id FROM news_categories WHERE slug = %s",
                        (category_slug,),
                    )
                    row = cur.fetchone()
                    if row:
                        category_id = row[0]
            except Exception as e:
                logger.warning("Failed to resolve category %r: %s", category_slug, e)

        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO news_articles
                       (title, content, slug, status, tags, image_url,
                        category_id, is_featured, published_at, updated_at)
                       VALUES (%s, %s, %s, 'published', %s, %s, %s, false, %s, %s)
                       RETURNING article_id""",
                    (title, content, slug, tags, image_url or '',
                     category_id, now, now),
                )
                article_id = cur.fetchone()[0]
                logger.info("Created news article #%d: %s (queue #%s)",
                            article_id, title[:50], source_queue_id)
                return article_id
        except Exception as e:
            logger.error("Failed to create news article: %s", e)
            return None

    def update_news_article_image(self, article_id: int, image_url: str):
        """Update the image_url of a news article."""
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    "UPDATE news_articles SET image_url = %s, updated_at = %s WHERE article_id = %s",
                    (image_url, datetime.utcnow(), article_id),
                )
        except Exception as e:
            logger.error("Failed to update article #%d image: %s", article_id, e)

    # ── close ─────────────────────────────────────────────────────────

    def close(self):
        self.conn.close()
