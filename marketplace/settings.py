import logging
import os
from pathlib import Path

import dj_database_url  # Для работы с DATABASE_URL от render.com
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Настройки Yandex Object Storage
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = "1-st-test-bucket-for-startup-platform-3gb-1"  # Старый бакет
AWS_S3_ENDPOINT_URL = "https://storage.yandexcloud.net"
AWS_DEFAULT_ACL = "public-read"
AWS_S3_FILE_OVERWRITE = False
AWS_S3_REGION_NAME = "ru-central1"
AWS_S3_SIGNATURE_VERSION = "s3v4"

# Настройка STORAGES (вместо DEFAULT_FILE_STORAGE)
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

# Проверка инициализации storages
try:
    from storages.backends.s3boto3 import S3Boto3Storage

    logger.info("django-storages успешно импортирован")
except ImportError as e:
    logger.error(f"Ошибка импорта django-storages: {str(e)}")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-0w+_*%hwspl5i9b)%9!i-3$dq5(e7i%e9*lh=v!u$4brh!5ok9",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"

# Настройка ALLOWED_HOSTS для render.com
ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "accounts",
    "storages",  # Убедись, что 'storages' добавлен
    "widget_tweaks",  # Добавляем widget_tweaks
    "django.contrib.humanize",  # Добавляем humanize
    "django_vite",  # Правильное имя приложения
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.telegram',
]

# Добавьте AUTHENTICATION_BACKENDS
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Добавьте настройки для Telegram
SITE_ID = 1

# Указываем allauth использовать наш кастомный адаптер
SOCIALACCOUNT_ADAPTER = 'accounts.adapter.CustomSocialAccountAdapter'

SOCIALACCOUNT_PROVIDERS = {
    'telegram': {
        'APP': {
            'client_id': 'testmarketstartup_bot',
            'secret': '7843250850:AAEL8hapR_WVcG2mMNUhWvK-I0DMYG042Ko',
        },
        'AUTH_PARAMS': {
            'auth_date_valid_within': 90,
        },
    }
}

SOCIALACCOUNT_QUERYSET_CACHING = False  # Отключаем кэширование SocialApp

# Перенаправление после входа
LOGIN_REDIRECT_URL = '/startups/'  # Редирект после любого входа
SOCIALACCOUNT_LOGIN_REDIRECT_URL = '/startups/'  # Редирект после Telegram-логина
SOCIALACCOUNT_LOGIN_ON_GET = True  # Разрешить GET-запросы для входа
ACCOUNT_EMAIL_REQUIRED = False  # Email не обязателен для Telegram
ACCOUNT_AUTHENTICATION_METHOD = 'username_email'
ACCOUNT_EMAIL_VERIFICATION = 'none'  # Отключите верификацию email
ACCOUNT_LOGOUT_REDIRECT_URL = 'startups_list'  # Перенаправление после выхода
ACCOUNT_USERNAME_REQUIRED = False  # Username не нужен

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Для статических файлов
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",  # Добавьте эту строку
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
            ],
        },
    },
]

WSGI_APPLICATION = "marketplace.wsgi.application"

# Database
DATABASES = {
    "default": dj_database_url.config(
        default="postgres://admin:aYNUwQ0YGogGyWIXoUwcNk6sQ5TMZBRd@dpg-cv2qcu0fnakc738e720g-a.frankfurt-postgres.render.com/marketplace_d1gj",
        conn_max_age=600,
    )
}

# Password validation
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

# Internationalization
LANGUAGE_CODE = "ru-RU"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
USE_L10N = True  # Добавляем для включения локализации форматов
USE_THOUSAND_SEPARATOR = True  # Добавляем для включения разделителя тысяч

# Кодировка по умолчанию
DEFAULT_CHARSET = "utf-8"

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATICFILES_DIRS = [
    BASE_DIR / "static",
    BASE_DIR / "static/dist",  # Vite будет собирать файлы сюда
]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Vite App Dir
VITE_APP_DIR = BASE_DIR / "static/src"

# Django Vite
DJANGO_VITE = {
    "default": {
        "manifest_path": BASE_DIR / "static/dist/.vite/manifest.json",
        "static_url_prefix": "dist",
    }
}

# Media files
MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.storage.yandexcloud.net/"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Кастомная модель пользователя
AUTH_USER_MODEL = "accounts.Users"

# Логирование для отладки
# Добавьте или обновите LOGGING в settings.py
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "level": "DEBUG",  # Установим DEBUG для детального вывода
            "class": "logging.StreamHandler",
        },
        "file": {
            "level": "DEBUG",
            "class": "logging.FileHandler",
            "filename": "debug.log",  # Файл для логов
        },
    },
    "loggers": {
        "": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": True,
        },
        "allauth.socialaccount": {  # Специфичный логгер для allauth
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}

# Настройки для HTTPS на render.com
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = ["https://greatideas.ru", "https://www.greatideas.ru"]

# Дополнительные настройки безопасности для продакшена
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

# Проверка текущего default_storage
logger.info("=== Проверка настроек Django ===")
logger.info(f"STORAGES: {STORAGES}")
logger.info(f"INSTALLED_APPS: {INSTALLED_APPS}")
logger.info(f"MEDIA_URL: {MEDIA_URL}")
logger.info(f"Текущий default_storage: {default_storage.__class__.__name__}")
