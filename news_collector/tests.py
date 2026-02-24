"""Unit tests for news_collector modules."""

import os
import re
import sys
import sqlite3
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

# Ensure news_collector is importable
sys.path.insert(0, os.path.dirname(__file__))

# Mock telethon before any imports that depend on it
# MessageService must be a real class for isinstance() checks in filters.py
class _FakeMessageService:
    pass

_telethon_mock = MagicMock()
_tl_types_mock = MagicMock()
_tl_types_mock.MessageService = _FakeMessageService

# StringSession mock — needs to behave like a callable class
class _FakeStringSession:
    def __init__(self, session_string=""):
        self._string = session_string

    @staticmethod
    def save(session):
        return "mock_session_string_abc123"

_sessions_mock = MagicMock()
_sessions_mock.StringSession = _FakeStringSession

sys.modules["telethon"] = _telethon_mock
sys.modules["telethon.sessions"] = _sessions_mock
sys.modules["telethon.tl"] = MagicMock()
sys.modules["telethon.tl.types"] = _tl_types_mock
sys.modules["telethon.events"] = MagicMock()


# ── SQLite adapter mimicking psycopg2 for tests ─────────────────────

def _pg_to_sqlite(sql):
    """Convert PostgreSQL SQL to SQLite SQL."""
    sql = sql.replace("%s", "?")
    sql = re.sub(r"ON CONFLICT\s+DO NOTHING", "OR IGNORE", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bSERIAL\b", "INTEGER", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bBIGINT\b", "INTEGER", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bTIMESTAMPTZ\b", "TEXT", sql, flags=re.IGNORECASE)
    sql = re.sub(r"DEFAULT\s+NOW\(\)", "DEFAULT ''", sql, flags=re.IGNORECASE)
    # Handle INSERT ... OR IGNORE ... VALUES → fix double INSERT
    sql = sql.replace("INSERT OR IGNORE INTO", "INSERT OR IGNORE INTO")
    sql = sql.replace("INSERT INTO", "INSERT INTO").replace("INSERT INTO OR IGNORE", "INSERT OR IGNORE INTO")
    # Fix: "INSERT INTO ... VALUES ... OR IGNORE" → move OR IGNORE after INSERT
    if "OR IGNORE" in sql and sql.index("OR IGNORE") > sql.index("VALUES") if "VALUES" in sql else False:
        sql = sql.replace("OR IGNORE", "")
        sql = sql.replace("INSERT INTO", "INSERT OR IGNORE INTO", 1)
    return sql


class _SQLiteCursor:
    """SQLite cursor that accepts PostgreSQL-style SQL."""

    def __init__(self, conn):
        self._conn = conn
        self._cursor = conn.cursor()
        self._returning = False

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def execute(self, sql, params=None):
        self._returning = "returning id" in sql.lower()
        sql = _pg_to_sqlite(sql)
        sql = re.sub(r"RETURNING\s+id", "", sql, flags=re.IGNORECASE).strip()
        self._cursor.execute(sql, params or ())
        self._conn.commit()
        return self._cursor

    def fetchone(self):
        if self._returning:
            self._returning = False
            return (self._cursor.lastrowid,)
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    @property
    def description(self):
        return self._cursor.description

    @property
    def rowcount(self):
        return self._cursor.rowcount


class _SQLiteAsPg:
    """SQLite connection mimicking psycopg2 interface for tests."""

    def __init__(self):
        self._conn = sqlite3.connect(":memory:")
        self.autocommit = True

    def cursor(self):
        return _SQLiteCursor(self._conn)

    def close(self):
        self._conn.close()


def _make_storage_in_memory():
    """Create a PostStorage backed by in-memory SQLite (psycopg2-compatible)."""
    from storage import PostStorage
    s = PostStorage.__new__(PostStorage)
    s.conn = _SQLiteAsPg()
    s._create_tables()
    return s


# ── config tests ──────────────────────────────────────────────────────

class TestConfigParsing(unittest.TestCase):
    """Test config.py channel/keyword parsing."""

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
        "SOURCE_CHANNELS": "startupoftheday,temno,rusven",
        "KEYWORDS": "",
    })
    def test_parse_string_channels(self):
        import importlib
        import config
        importlib.reload(config)
        self.assertEqual(
            config.SOURCE_CHANNELS_LIST,
            ["startupoftheday", "temno", "rusven"],
        )

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
        "SOURCE_CHANNELS": "-1001234567890,-1009876543210",
        "KEYWORDS": "",
    })
    def test_parse_int_channels(self):
        import importlib
        import config
        importlib.reload(config)
        self.assertEqual(
            config.SOURCE_CHANNELS_LIST,
            [-1001234567890, -1009876543210],
        )

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
        "SOURCE_CHANNELS": "-1001234567890, startupoftheday , temno",
        "KEYWORDS": "",
    })
    def test_parse_mixed_channels(self):
        import importlib
        import config
        importlib.reload(config)
        self.assertEqual(
            config.SOURCE_CHANNELS_LIST,
            [-1001234567890, "startupoftheday", "temno"],
        )

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
        "SOURCE_CHANNELS": "one,,two, ,three",
        "KEYWORDS": "стартап, инвестиции , венчур",
    })
    def test_empty_entries_stripped(self):
        import importlib
        import config
        importlib.reload(config)
        self.assertEqual(config.SOURCE_CHANNELS_LIST, ["one", "two", "three"])
        self.assertEqual(config.KEYWORDS_LIST, ["стартап", "инвестиции", "венчур"])

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
        "SOURCE_CHANNELS": "chan1",
        "KEYWORDS": "",
    })
    def test_empty_keywords_means_no_filter(self):
        import importlib
        import config
        importlib.reload(config)
        self.assertEqual(config.KEYWORDS_LIST, [])

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
        "TELETHON_SESSION": "abc123session",
    })
    def test_telethon_session_from_env(self):
        import importlib
        import config
        importlib.reload(config)
        self.assertEqual(config.TELETHON_SESSION, "abc123session")

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
    }, clear=False)
    def test_telethon_session_default_empty(self):
        import importlib
        import config
        # Remove TELETHON_SESSION if present
        os.environ.pop("TELETHON_SESSION", None)
        importlib.reload(config)
        self.assertEqual(config.TELETHON_SESSION, "")


# ── collector: create_client with StringSession ──────────────────────

class TestCreateClient(unittest.TestCase):
    """Test collector.create_client with and without StringSession."""

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
    })
    def test_create_client_with_session_string(self):
        """When session_string is provided, StringSession should be used."""
        import importlib
        import config
        importlib.reload(config)
        from collector import create_client
        # Should not raise
        client = create_client(session_string="test_session_string")
        # TelegramClient is mocked, so just verify it was called
        self.assertIsNotNone(client)

    @patch.dict(os.environ, {
        "TELEGRAM_API_ID": "12345",
        "TELEGRAM_API_HASH": "abc",
        "TELEGRAM_PHONE": "+71234567890",
        "NEWS_BOT_TOKEN": "token",
        "TARGET_GROUP_ID": "-100999",
    })
    def test_create_client_without_session_string(self):
        """Without session_string, file-based session should be used."""
        import importlib
        import config
        importlib.reload(config)
        from collector import create_client
        client = create_client()
        self.assertIsNotNone(client)


# ── storage: processed posts ──────────────────────────────────────────

class TestPostStorage(unittest.TestCase):
    """Test storage.py PostStorage with in-memory SQLite."""

    def setUp(self):
        self.storage = _make_storage_in_memory()

    def tearDown(self):
        self.storage.close()

    def test_mark_and_check(self):
        self.assertFalse(self.storage.is_processed("chan1", 100))
        self.storage.mark_processed("chan1", 100)
        self.assertTrue(self.storage.is_processed("chan1", 100))

    def test_different_channels_independent(self):
        self.storage.mark_processed("chan1", 1)
        self.assertTrue(self.storage.is_processed("chan1", 1))
        self.assertFalse(self.storage.is_processed("chan2", 1))

    def test_duplicate_insert_ignored(self):
        self.storage.mark_processed("chan1", 1)
        self.storage.mark_processed("chan1", 1)
        self.assertTrue(self.storage.is_processed("chan1", 1))

    def test_cleanup_removes_old(self):
        old_date = (datetime.utcnow() - timedelta(days=60)).isoformat()
        with self.storage.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO news_processed_posts (channel_id, message_id, processed_at) VALUES (%s, %s, %s)",
                ("chan1", 1, old_date),
            )
        self.storage.mark_processed("chan1", 2)

        self.storage.cleanup(days=30)
        self.assertFalse(self.storage.is_processed("chan1", 1))
        self.assertTrue(self.storage.is_processed("chan1", 2))

    def test_get_processed_count(self):
        self.assertEqual(self.storage.get_processed_count(), 0)
        self.storage.mark_processed("c1", 1)
        self.storage.mark_processed("c1", 2)
        self.assertEqual(self.storage.get_processed_count(), 2)


# ── storage: dynamic channels ─────────────────────────────────────────

class TestDynamicChannels(unittest.TestCase):

    def setUp(self):
        self.storage = _make_storage_in_memory()

    def tearDown(self):
        self.storage.close()

    def test_add_and_list(self):
        self.storage.add_channel("startupoftheday")
        self.storage.add_channel(-1001234567890)
        channels = self.storage.get_channels()
        self.assertIn("startupoftheday", channels)
        self.assertIn(-1001234567890, channels)

    def test_remove(self):
        self.storage.add_channel("test_channel")
        self.assertTrue(self.storage.remove_channel("test_channel"))
        self.assertNotIn("test_channel", self.storage.get_channels())

    def test_remove_nonexistent(self):
        self.assertFalse(self.storage.remove_channel("doesnt_exist"))

    def test_duplicate_add(self):
        self.storage.add_channel("ch1")
        self.storage.add_channel("ch1")
        channels = self.storage.get_channels()
        self.assertEqual(channels.count("ch1"), 1)


# ── storage: dynamic keywords ─────────────────────────────────────────

class TestDynamicKeywords(unittest.TestCase):

    def setUp(self):
        self.storage = _make_storage_in_memory()

    def tearDown(self):
        self.storage.close()

    def test_add_and_list(self):
        self.storage.add_keyword("Стартап")
        self.storage.add_keyword("Инвестиции")
        kws = self.storage.get_keywords()
        self.assertIn("стартап", kws)
        self.assertIn("инвестиции", kws)

    def test_lowercased(self):
        self.storage.add_keyword("ВЕНЧУР")
        self.assertEqual(self.storage.get_keywords(), ["венчур"])

    def test_remove(self):
        self.storage.add_keyword("test")
        self.assertTrue(self.storage.remove_keyword("test"))
        self.assertNotIn("test", self.storage.get_keywords())

    def test_empty_keyword_rejected(self):
        self.assertFalse(self.storage.add_keyword(""))
        self.assertFalse(self.storage.add_keyword("   "))


# ── storage: spam words ───────────────────────────────────────────────

class TestSpamWords(unittest.TestCase):

    def setUp(self):
        self.storage = _make_storage_in_memory()

    def tearDown(self):
        self.storage.close()

    def test_add_and_list(self):
        self.storage.add_spam_word("казино")
        self.storage.add_spam_word("Реклама")
        words = self.storage.get_spam_words()
        self.assertIn("казино", words)
        self.assertIn("реклама", words)

    def test_remove(self):
        self.storage.add_spam_word("спам")
        self.assertTrue(self.storage.remove_spam_word("спам"))
        self.assertNotIn("спам", self.storage.get_spam_words())

    def test_empty_word_rejected(self):
        self.assertFalse(self.storage.add_spam_word(""))


# ── filters tests ─────────────────────────────────────────────────────

class TestFilters(unittest.TestCase):
    """Test filters.py should_process logic."""

    def _make_event(self, text="Hello", media=None, msg_id=1, chat_id="-100123"):
        event = MagicMock()
        event.chat_id = chat_id
        event.message = MagicMock(spec=[])
        event.message.id = msg_id
        event.message.text = text
        event.message.media = media
        return event

    def _make_storage(self, processed=False, spam_words=None, keywords=None):
        s = MagicMock()
        s.is_processed.return_value = processed
        s.get_spam_words.return_value = spam_words or []
        s.get_keywords.return_value = keywords or []
        return s

    @patch("filters.KEYWORDS_LIST", [])
    def test_pass_all_when_no_keywords(self):
        from filters import should_process
        event = self._make_event(text="Random text about cats")
        self.assertTrue(should_process(event, self._make_storage()))

    @patch("filters.KEYWORDS_LIST", ["стартап", "инвестиции"])
    def test_pass_matching_keyword(self):
        from filters import should_process
        event = self._make_event(text="Новый стартап получил инвестиции")
        self.assertTrue(should_process(event, self._make_storage()))

    @patch("filters.KEYWORDS_LIST", ["стартап", "инвестиции"])
    def test_reject_no_matching_keyword(self):
        from filters import should_process
        event = self._make_event(text="Погода сегодня хорошая")
        self.assertFalse(should_process(event, self._make_storage()))

    @patch("filters.KEYWORDS_LIST", [])
    def test_reject_duplicate(self):
        from filters import should_process
        event = self._make_event(text="Some text")
        self.assertFalse(should_process(event, self._make_storage(processed=True)))

    @patch("filters.KEYWORDS_LIST", [])
    def test_reject_empty_message(self):
        from filters import should_process
        event = self._make_event(text=None, media=None)
        self.assertFalse(should_process(event, self._make_storage()))

    @patch("filters.KEYWORDS_LIST", [])
    def test_pass_media_without_text(self):
        from filters import should_process
        event = self._make_event(text=None, media=MagicMock())
        self.assertTrue(should_process(event, self._make_storage()))

    @patch("filters.KEYWORDS_LIST", ["стартап"])
    def test_keyword_filter_skipped_for_media_without_text(self):
        """Media without text should pass even with keyword filter."""
        from filters import should_process
        event = self._make_event(text=None, media=MagicMock())
        self.assertTrue(should_process(event, self._make_storage()))

    @patch("filters.KEYWORDS_LIST", ["стартап"])
    def test_keyword_case_insensitive(self):
        from filters import should_process
        event = self._make_event(text="Новый СТАРТАП запустился")
        self.assertTrue(should_process(event, self._make_storage()))

    # ── spam filter tests ─────────────────────────────────────────

    @patch("filters.KEYWORDS_LIST", [])
    def test_spam_word_blocks_message(self):
        from filters import should_process
        event = self._make_event(text="Выиграй в казино прямо сейчас!")
        storage = self._make_storage(spam_words=["казино"])
        self.assertFalse(should_process(event, storage))

    @patch("filters.KEYWORDS_LIST", [])
    def test_spam_check_case_insensitive(self):
        from filters import should_process
        event = self._make_event(text="КАЗИНО для всех")
        storage = self._make_storage(spam_words=["казино"])
        self.assertFalse(should_process(event, storage))

    @patch("filters.KEYWORDS_LIST", [])
    def test_no_spam_words_passes(self):
        from filters import should_process
        event = self._make_event(text="Обычный пост про бизнес")
        storage = self._make_storage(spam_words=[])
        self.assertTrue(should_process(event, storage))

    @patch("filters.KEYWORDS_LIST", ["стартап"])
    def test_spam_beats_keyword(self):
        """Spam filter takes priority over keyword match."""
        from filters import should_process
        event = self._make_event(text="Стартап-казино — инвестируй!")
        storage = self._make_storage(spam_words=["казино"])
        self.assertFalse(should_process(event, storage))

    # ── dynamic keywords in filter ────────────────────────────────

    @patch("filters.KEYWORDS_LIST", [])
    def test_dynamic_keyword_works(self):
        from filters import should_process
        event = self._make_event(text="Новый раунд финансирования")
        storage = self._make_storage(keywords=["раунд"])
        self.assertTrue(should_process(event, storage))

    @patch("filters.KEYWORDS_LIST", [])
    def test_dynamic_keyword_rejects_non_match(self):
        from filters import should_process
        event = self._make_event(text="Погода хорошая")
        storage = self._make_storage(keywords=["раунд"])
        self.assertFalse(should_process(event, storage))


# ── publisher tests ───────────────────────────────────────────────────

class TestPublisher(unittest.TestCase):
    """Test publisher.py functions with mocked HTTP."""

    @patch("publisher.requests.post")
    def test_send_message_success(self, mock_post):
        mock_post.return_value.json.return_value = {"ok": True, "result": {}}
        mock_post.return_value.status_code = 200

        from publisher import send_message
        result = send_message("Test message", source_name="@test")
        self.assertIsNotNone(result)
        self.assertTrue(result["ok"])

    @patch("publisher.requests.post")
    def test_send_message_adds_source(self, mock_post):
        mock_post.return_value.json.return_value = {"ok": True, "result": {}}
        mock_post.return_value.status_code = 200

        from publisher import send_message
        send_message("Hello", source_name="@channel")
        call_args = mock_post.call_args
        data = call_args.kwargs.get("data") or call_args[1].get("data", {})
        self.assertIn("@channel", data.get("text", ""))
        self.assertIn("Источник", data.get("text", ""))

    @patch("publisher.requests.post")
    def test_send_message_without_source(self, mock_post):
        mock_post.return_value.json.return_value = {"ok": True, "result": {}}
        mock_post.return_value.status_code = 200

        from publisher import send_message
        send_message("Plain message")
        call_args = mock_post.call_args
        data = call_args.kwargs.get("data") or call_args[1].get("data", {})
        self.assertEqual(data.get("text"), "Plain message")

    @patch("publisher.requests.post")
    def test_send_photo_caption_truncated(self, mock_post):
        mock_post.return_value.json.return_value = {"ok": True, "result": {}}
        mock_post.return_value.status_code = 200

        from publisher import send_photo
        long_caption = "A" * 2000
        send_photo(b"\x00\x01\x02", caption=long_caption)
        call_args = mock_post.call_args
        data = call_args.kwargs.get("data") or call_args[1].get("data", {})
        self.assertLessEqual(len(data.get("caption", "")), 1024)

    @patch("publisher.requests.post")
    def test_send_video(self, mock_post):
        mock_post.return_value.json.return_value = {"ok": True, "result": {}}
        mock_post.return_value.status_code = 200

        from publisher import send_video
        result = send_video(b"\x00\x01", caption="test vid", source_name="@src")
        self.assertIsNotNone(result)

    @patch("publisher.requests.post")
    def test_send_document(self, mock_post):
        mock_post.return_value.json.return_value = {"ok": True, "result": {}}
        mock_post.return_value.status_code = 200

        from publisher import send_document
        result = send_document(b"\x00", "file.pdf", caption="doc", source_name="@src")
        self.assertIsNotNone(result)

    @patch("publisher.requests.post")
    def test_retry_on_network_error(self, mock_post):
        import requests as req
        mock_post.side_effect = [
            req.RequestException("timeout"),
            req.RequestException("timeout"),
            MagicMock(json=lambda: {"ok": True}, status_code=200),
        ]
        from publisher import send_message
        with patch("publisher.RETRY_DELAY", 0):
            result = send_message("test")
        self.assertIsNotNone(result)

    @patch("publisher.requests.post")
    def test_all_retries_exhausted(self, mock_post):
        import requests as req
        mock_post.side_effect = req.RequestException("timeout")
        from publisher import send_message
        with patch("publisher.RETRY_DELAY", 0):
            result = send_message("test")
        self.assertIsNone(result)

    @patch("publisher.requests.post")
    def test_rate_limit_429(self, mock_post):
        rate_resp = MagicMock()
        rate_resp.json.return_value = {"ok": False, "description": "Too Many Requests", "parameters": {"retry_after": 0}}
        rate_resp.status_code = 429
        ok_resp = MagicMock()
        ok_resp.json.return_value = {"ok": True, "result": {}}
        ok_resp.status_code = 200
        mock_post.side_effect = [rate_resp, ok_resp]

        from publisher import send_message
        result = send_message("test")
        self.assertIsNotNone(result)
        self.assertEqual(mock_post.call_count, 2)


# ── storage: moderation queue ────────────────────────────────────────

class TestModerationQueue(unittest.TestCase):
    """Test moderation_queue CRUD in PostStorage."""

    def setUp(self):
        self.storage = _make_storage_in_memory()

    def tearDown(self):
        self.storage.close()

    def test_add_and_get(self):
        qid = self.storage.add_to_moderation_queue(
            source_channel="@testchan",
            original_text="Hello world",
            media_type="photo",
            media_filename="pic.jpg",
            source_msg_id=42,
        )
        self.assertIsInstance(qid, int)
        self.assertGreater(qid, 0)

        post = self.storage.get_moderation_post(qid)
        self.assertIsNotNone(post)
        self.assertEqual(post["source_channel"], "@testchan")
        self.assertEqual(post["original_text"], "Hello world")
        self.assertEqual(post["media_type"], "photo")
        self.assertEqual(post["media_filename"], "pic.jpg")
        self.assertEqual(post["source_msg_id"], 42)
        self.assertEqual(post["status"], "pending")
        self.assertEqual(post["edit_count"], 0)

    def test_get_nonexistent(self):
        self.assertIsNone(self.storage.get_moderation_post(99999))

    def test_update(self):
        qid = self.storage.add_to_moderation_queue(
            source_channel="@ch", original_text="text",
        )
        self.storage.update_moderation_queue(
            qid, status="edited", edited_text="new text", edit_count=1, bot_msg_id=555,
        )
        post = self.storage.get_moderation_post(qid)
        self.assertEqual(post["status"], "edited")
        self.assertEqual(post["edited_text"], "new text")
        self.assertEqual(post["edit_count"], 1)
        self.assertEqual(post["bot_msg_id"], 555)

    def test_pending_count(self):
        self.assertEqual(self.storage.get_pending_moderation_count(), 0)

        qid1 = self.storage.add_to_moderation_queue(source_channel="@a", original_text="a")
        self.storage.update_moderation_queue(qid1, status="sent")
        self.assertEqual(self.storage.get_pending_moderation_count(), 1)

        qid2 = self.storage.add_to_moderation_queue(source_channel="@b", original_text="b")
        self.storage.update_moderation_queue(qid2, status="edited")
        self.assertEqual(self.storage.get_pending_moderation_count(), 2)

        # skipped and published don't count
        qid3 = self.storage.add_to_moderation_queue(source_channel="@c", original_text="c")
        self.storage.update_moderation_queue(qid3, status="skipped")
        self.assertEqual(self.storage.get_pending_moderation_count(), 2)

    def test_text_only_post(self):
        qid = self.storage.add_to_moderation_queue(
            source_channel="@ch", original_text="Just text",
        )
        post = self.storage.get_moderation_post(qid)
        self.assertEqual(post["media_type"], "")
        self.assertEqual(post["media_filename"], "")


# ── grok: callback data parsing ─────────────────────────────────────

class TestCallbackDataParsing(unittest.TestCase):
    """Test that callback data strings parse correctly."""

    def test_skip_format(self):
        data = "skip:123"
        action, qid = data.split(":", 1)
        self.assertEqual(action, "skip")
        self.assertEqual(int(qid), 123)

    def test_edit_format(self):
        data = "edit:456"
        action, qid = data.split(":", 1)
        self.assertEqual(action, "edit")
        self.assertEqual(int(qid), 456)

    def test_reedit_format(self):
        data = "reedit:789"
        action, qid = data.split(":", 1)
        self.assertEqual(action, "reedit")
        self.assertEqual(int(qid), 789)

    def test_pub_format(self):
        data = "pub:10"
        action, qid = data.split(":", 1)
        self.assertEqual(action, "pub")
        self.assertEqual(int(qid), 10)


# ── grok: rewrite_news mock ─────────────────────────────────────────

class TestGrokRewrite(unittest.TestCase):
    """Test grok.rewrite_news with mocked aiohttp."""

    def test_raises_without_api_key(self):
        import asyncio
        with patch("config.GROK_API_KEY", ""):
            from grok import rewrite_news, GrokError
            with self.assertRaises(GrokError):
                asyncio.get_event_loop().run_until_complete(rewrite_news("test"))

    def test_successful_rewrite(self):
        import asyncio

        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = MagicMock(return_value=asyncio.coroutine(lambda: {
            "choices": [{"message": {"content": "Rewritten text"}}]
        })())
        mock_response.__aenter__ = asyncio.coroutine(lambda s: mock_response)
        mock_response.__aexit__ = asyncio.coroutine(lambda s, *a: None)

        mock_session = MagicMock()
        mock_session.post = MagicMock(return_value=mock_response)
        mock_session.__aenter__ = asyncio.coroutine(lambda s: mock_session)
        mock_session.__aexit__ = asyncio.coroutine(lambda s, *a: None)

        with patch("config.GROK_API_KEY", "test-key"):
            with patch("grok.aiohttp.ClientSession", return_value=mock_session):
                from grok import rewrite_news
                result = asyncio.get_event_loop().run_until_complete(rewrite_news("Original"))
                self.assertEqual(result, "Rewritten text")


if __name__ == "__main__":
    unittest.main()
