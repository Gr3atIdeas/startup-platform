import sqlite3
import logging
from datetime import datetime, timedelta

from config import DB_PATH

logger = logging.getLogger(__name__)


class PostStorage:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH)
        self._create_table()
        logger.info("Storage initialized: %s", DB_PATH)

    def _create_table(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS processed_posts (
                channel_id TEXT NOT NULL,
                message_id INTEGER NOT NULL,
                processed_at TEXT NOT NULL,
                PRIMARY KEY (channel_id, message_id)
            )
        """)
        self.conn.commit()

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

    def close(self):
        self.conn.close()
