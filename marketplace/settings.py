import logging
import os
from pathlib import Path
import dj_database_url
from django.core.files.storage import default_storage
logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent.parent
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN") or "8036121538:AAG6PyLDOnTNL6rLgRKaq2w1mrXKTYNsDlc"
TELEGRAM_OWNER_CHAT_ID = os.getenv("TELEGRAM_OWNER_CHAT_ID") or "209725232"
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "1-bucket-for-startup-platform1")
AWS_S3_ENDPOINT_URL = "https://storage.yandexcloud.net"
AWS_DEFAULT_ACL = "public-read"
AWS_S3_FILE_OVERWRITE = False
AWS_S3_REGION_NAME = "ru-central1"
AWS_S3_SIGNATURE_VERSION = "s3v4"
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "access_key": AWS_ACCESS_KEY_ID,
            "secret_key": AWS_SECRET_ACCESS_KEY,
            "bucket_name": AWS_STORAGE_BUCKET_NAME,
            "endpoint_url": AWS_S3_ENDPOINT_URL,
            "default_acl": AWS_DEFAULT_ACL,
            "file_overwrite": AWS_S3_FILE_OVERWRITE,
            "region_name": AWS_S3_REGION_NAME,
            "signature_version": AWS_S3_SIGNATURE_VERSION,
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
try:
    from storages.backends.s3boto3 import S3Boto3Storage
    logger.info("django-storages успешно импортирован")
except ImportError as e:
    logger.error(f"Ошибка импорта django-storages: {str(e)}")
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-0w+_*%hwspl5i9b)%9!i-3$dq5(e7i%e9*lh=v!u$4brh!5ok9",
)
DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"
ALLOWED_HOSTS = ["*"]
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "accounts",
    "storages",
    "widget_tweaks",
    "django.contrib.humanize",
    "django_vite",
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.telegram',
]
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]
SITE_ID = 1
SOCIALACCOUNT_ADAPTER = 'accounts.adapter.CustomSocialAccountAdapter'
SOCIALACCOUNT_PROVIDERS = {
    'telegram': {
        'APP': {
            'client_id': 'testmarketstartup_bot',
            'secret': TELEGRAM_BOT_TOKEN,
        },
        'AUTH_PARAMS': {
            'auth_date_valid_within': 90,
        },
    }
}
SOCIALACCOUNT_QUERYSET_CACHING = False
LOGIN_REDIRECT_URL = '/startups/'
SOCIALACCOUNT_LOGIN_REDIRECT_URL = '/startups/'
SOCIALACCOUNT_LOGIN_ON_GET = True
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_LOGOUT_REDIRECT_URL = 'startups_list'
LOGIN_URL = '/login/'
ACCOUNT_LOGIN_METHODS = ['username', 'email']
ACCOUNT_SIGNUP_FIELDS = ['email', 'password1*', 'password2*']
ACCOUNT_USERNAME_REQUIRED = False
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "accounts.middleware.WwwRedirectMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "marketplace.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "marketplace.context_processors.s3_public_base_url",
            ],
        },
    },
]
WSGI_APPLICATION = "marketplace.wsgi.application"
DATABASES = {
    "default": dj_database_url.config(
        default="postgres://admin:aYNUwQ0YGogGyWIXoUwcNk6sQ5TMZBRd@dpg-cv2qcu0fnakc738e720g-a.frankfurt-postgres.render.com/marketplace_d1gj",
        conn_max_age=600,
    )
}
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]
LANGUAGE_CODE = "ru-RU"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
USE_L10N = True
USE_THOUSAND_SEPARATOR = True
DEFAULT_CHARSET = "utf-8"
STATIC_URL = "/static/"
STATICFILES_DIRS = [
    BASE_DIR / "static",
    BASE_DIR / "static/dist",
]
STATIC_ROOT = BASE_DIR / "staticfiles"
VITE_APP_DIR = BASE_DIR / "static/src"
DJANGO_VITE = {
    "default": {
        "manifest_path": BASE_DIR / "static/dist/.vite/manifest.json",
        "static_url_prefix": "dist",
    }
}
S3_PUBLIC_BASE_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.storage.yandexcloud.net"
MEDIA_URL = f"{S3_PUBLIC_BASE_URL}/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.Users"
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
        },
        "file": {
            "level": "DEBUG",
            "class": "logging.FileHandler",
            "filename": "debug.log",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": True,
        },
        "allauth.socialaccount": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = ["https://greatideas.ru", "https://www.greatideas.ru"]
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
logger.info("=== Проверка настроек Django ===")
logger.info(f"STORAGES: {STORAGES}")
logger.info(f"INSTALLED_APPS: {INSTALLED_APPS}")
logger.info(f"MEDIA_URL: {MEDIA_URL}")
logger.info(f"Текущий default_storage: {default_storage.__class__.__name__}")
