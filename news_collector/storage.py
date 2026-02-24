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

    # ── close ─────────────────────────────────────────────────────────

    def close(self):
        self.conn.close()
