import sqlite3
import logging
from datetime import datetime, timedelta

from config import DB_PATH

logger = logging.getLogger(__name__)


class PostStorage:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH)
        self._create_tables()
        logger.info("Storage initialized: %s", DB_PATH)

    def _create_tables(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS processed_posts (
                channel_id TEXT NOT NULL,
                message_id INTEGER NOT NULL,
                processed_at TEXT NOT NULL,
                PRIMARY KEY (channel_id, message_id)
            );
            CREATE TABLE IF NOT EXISTS dynamic_channels (
                channel TEXT PRIMARY KEY,
                added_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS dynamic_keywords (
                keyword TEXT PRIMARY KEY,
                added_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS spam_words (
                word TEXT PRIMARY KEY,
                added_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS moderation_queue (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                source_channel  TEXT NOT NULL,
                source_msg_id   INTEGER,
                original_text   TEXT DEFAULT '',
                edited_text     TEXT DEFAULT '',
                media_type      TEXT DEFAULT '',
                media_file_id   TEXT DEFAULT '',
                media_filename  TEXT DEFAULT '',
                bot_msg_id      INTEGER,
                status          TEXT NOT NULL DEFAULT 'pending',
                edit_count      INTEGER DEFAULT 0,
                created_at      TEXT NOT NULL,
                updated_at      TEXT NOT NULL
            );
        """)
        self.conn.commit()

    # ── processed posts ───────────────────────────────────────────────

    def is_processed(self, channel_id: str, message_id: int) -> bool:
        cursor = self.conn.execute(
            "SELECT 1 FROM processed_posts WHERE channel_id = ? AND message_id = ?",
            (str(channel_id), message_id),
        )
        return cursor.fetchone() is not None

    def mark_processed(self, channel_id: str, message_id: int):
        self.conn.execute(
            "INSERT OR IGNORE INTO processed_posts (channel_id, message_id, processed_at) VALUES (?, ?, ?)",
            (str(channel_id), message_id, datetime.utcnow().isoformat()),
        )
        self.conn.commit()

    def cleanup(self, days: int = 30):
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        cursor = self.conn.execute(
            "DELETE FROM processed_posts WHERE processed_at < ?", (cutoff,)
        )
        if cursor.rowcount > 0:
            logger.info("Cleaned up %d old records", cursor.rowcount)
        self.conn.commit()

    def get_processed_count(self) -> int:
        cursor = self.conn.execute("SELECT COUNT(*) FROM processed_posts")
        return cursor.fetchone()[0]

    # ── dynamic channels ──────────────────────────────────────────────

    def get_channels(self) -> list:
        cursor = self.conn.execute("SELECT channel FROM dynamic_channels ORDER BY added_at")
        rows = cursor.fetchall()
        result = []
        for (ch,) in rows:
            try:
                result.append(int(ch))
            except ValueError:
                result.append(ch)
        return result

    def add_channel(self, channel) -> bool:
        try:
            self.conn.execute(
                "INSERT OR IGNORE INTO dynamic_channels (channel, added_at) VALUES (?, ?)",
                (str(channel), datetime.utcnow().isoformat()),
            )
            self.conn.commit()
            return self.conn.total_changes > 0
        except Exception as e:
            logger.error("Failed to add channel %s: %s", channel, e)
            return False

    def remove_channel(self, channel) -> bool:
        cursor = self.conn.execute(
            "DELETE FROM dynamic_channels WHERE channel = ?", (str(channel),)
        )
        self.conn.commit()
        return cursor.rowcount > 0

    # ── dynamic keywords ──────────────────────────────────────────────

    def get_keywords(self) -> list[str]:
        cursor = self.conn.execute("SELECT keyword FROM dynamic_keywords ORDER BY added_at")
        return [row[0] for row in cursor.fetchall()]

    def add_keyword(self, keyword: str) -> bool:
        kw = keyword.strip().lower()
        if not kw:
            return False
        try:
            self.conn.execute(
                "INSERT OR IGNORE INTO dynamic_keywords (keyword, added_at) VALUES (?, ?)",
                (kw, datetime.utcnow().isoformat()),
            )
            self.conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to add keyword %s: %s", kw, e)
            return False

    def remove_keyword(self, keyword: str) -> bool:
        cursor = self.conn.execute(
            "DELETE FROM dynamic_keywords WHERE keyword = ?", (keyword.strip().lower(),)
        )
        self.conn.commit()
        return cursor.rowcount > 0

    # ── spam words ────────────────────────────────────────────────────

    def get_spam_words(self) -> list[str]:
        cursor = self.conn.execute("SELECT word FROM spam_words ORDER BY added_at")
        return [row[0] for row in cursor.fetchall()]

    def add_spam_word(self, word: str) -> bool:
        w = word.strip().lower()
        if not w:
            return False
        try:
            self.conn.execute(
                "INSERT OR IGNORE INTO spam_words (word, added_at) VALUES (?, ?)",
                (w, datetime.utcnow().isoformat()),
            )
            self.conn.commit()
            return True
        except Exception as e:
            logger.error("Failed to add spam word %s: %s", w, e)
            return False

    def remove_spam_word(self, word: str) -> bool:
        cursor = self.conn.execute(
            "DELETE FROM spam_words WHERE word = ?", (word.strip().lower(),)
        )
        self.conn.commit()
        return cursor.rowcount > 0

    # ── moderation queue ──────────────────────────────────────────────

    def add_to_moderation_queue(self, source_channel: str, original_text: str,
                                media_type: str = '', media_filename: str = '',
                                source_msg_id: int = None) -> int:
        now = datetime.utcnow().isoformat()
        cursor = self.conn.execute(
            """INSERT INTO moderation_queue
               (source_channel, source_msg_id, original_text, media_type, media_filename,
                status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)""",
            (source_channel, source_msg_id, original_text, media_type, media_filename, now, now),
        )
        self.conn.commit()
        return cursor.lastrowid

    def get_moderation_post(self, queue_id: int) -> dict | None:
        cursor = self.conn.execute(
            "SELECT * FROM moderation_queue WHERE id = ?", (queue_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, row))

    def update_moderation_queue(self, queue_id: int, **kwargs):
        kwargs['updated_at'] = datetime.utcnow().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in kwargs)
        values = list(kwargs.values()) + [queue_id]
        self.conn.execute(
            f"UPDATE moderation_queue SET {set_clause} WHERE id = ?", values
        )
        self.conn.commit()

    def get_pending_moderation_count(self) -> int:
        cursor = self.conn.execute(
            "SELECT COUNT(*) FROM moderation_queue WHERE status IN ('sent', 'edited')"
        )
        return cursor.fetchone()[0]

    # ── close ─────────────────────────────────────────────────────────

    def close(self):
        self.conn.close()
