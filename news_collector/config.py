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

# Grok (xAI) API — AI-рерайт новостей
GROK_API_KEY = os.getenv("GROK_API_KEY", "")
GROK_MODEL = os.getenv("GROK_MODEL", "grok-3-mini")

# Proxy for outbound requests (Grok API + Telegram MTProto) — needed on Russian IPs
# Supports: http://user:pass@host:port, socks5://user:pass@host:port
PROXY_URL = os.getenv("PROXY_URL", "")


def get_telethon_proxy():
    """Parse PROXY_URL into a tuple for Telethon's proxy= parameter.

    Returns None if no proxy is configured.
    """
    if not PROXY_URL:
        return None
    from urllib.parse import urlparse
    import socks
    parsed = urlparse(PROXY_URL)
    proxy_types = {
        'socks5': socks.SOCKS5,
        'socks4': socks.SOCKS4,
        'http': socks.HTTP,
    }
    scheme = parsed.scheme.lower()
    proxy_type = proxy_types.get(scheme, socks.SOCKS5)
    return (proxy_type, parsed.hostname, parsed.port, True, parsed.username, parsed.password)

# Канал для публикации одобренных новостей (бот должен быть админом)
PUBLISH_CHANNEL_ID = os.getenv("PUBLISH_CHANNEL_ID", "")

# S3 (Yandex Cloud) — for uploading news images to website
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "1-bucket-for-startup-platform1")
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL", "https://storage.yandexcloud.net")
S3_PUBLIC_BASE_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.storage.yandexcloud.net"

# PostgreSQL — shared with Django (from DATABASE_URL)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Telethon StringSession — persistent session across deploys
# After /auth, the bot sends the session string. Save it here in Coolify env vars.
TELETHON_SESSION = os.getenv("TELETHON_SESSION", "")

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
