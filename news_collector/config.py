import os
import sys

# dotenv — only for local development, optional
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_PHONE = os.getenv("TELEGRAM_PHONE")
NEWS_BOT_TOKEN = os.getenv("NEWS_BOT_TOKEN")
TARGET_GROUP_ID = os.getenv("TARGET_GROUP_ID")
SOURCE_CHANNELS = os.getenv("SOURCE_CHANNELS", "")
KEYWORDS = os.getenv("KEYWORDS", "")
ADMIN_ID = 911873673

# Parse comma-separated lists
# Каналы могут быть юзернеймами (startupnews) или ID (-1001234567890)
def _parse_channel(ch):
    ch = ch.strip()
    try:
        return int(ch)
    except ValueError:
        return ch

SOURCE_CHANNELS_LIST = [_parse_channel(ch) for ch in SOURCE_CHANNELS.split(",") if ch.strip()]
KEYWORDS_LIST = [kw.strip().lower() for kw in KEYWORDS.split(",") if kw.strip()]

# Session file path (persistent across restarts)
SESSION_PATH = os.path.join(os.path.dirname(__file__), "data", "news_collector")

# SQLite database path
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "processed_posts.db")

REQUIRED_VARS = {
    "TELEGRAM_API_ID": TELEGRAM_API_ID,
    "TELEGRAM_API_HASH": TELEGRAM_API_HASH,
    "NEWS_BOT_TOKEN": NEWS_BOT_TOKEN,
    "TARGET_GROUP_ID": TARGET_GROUP_ID,
}


def validate():
    missing = [name for name, value in REQUIRED_VARS.items() if not value]
    if missing:
        print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)
    try:
        int(TELEGRAM_API_ID)
    except (ValueError, TypeError):
        print("ERROR: TELEGRAM_API_ID must be a number")
        sys.exit(1)
