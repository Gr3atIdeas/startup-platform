from allauth.socialaccount.admin import SocialAppAdmin
from allauth.socialaccount.models import SocialApp
from django.apps import apps
from django.contrib import admin
from django.core.signals import request_started


def ready(sender, **kwargs):
    # Этот код выполнится один раз при первом запросе,
    # когда все приложения уже гарантированно загружены.

    # Создаем наш кастомный класс админки
    class CustomSocialAppAdmin(SocialAppAdmin):
        def log_addition(self, *args, **kwargs):
            pass

        def log_change(self, *args, **kwargs):
            pass

        def log_deletion(self, *args, **kwargs):
            pass

    # Проверяем, зарегистрирована ли модель, и если да - заменяем админку
    if admin.site.is_registered(SocialApp):
        admin.site.unregister(SocialApp)
    admin.site.register(SocialApp, CustomSocialAppAdmin)

    # Отключаем сам сигнал, чтобы он не выполнялся при каждом запросе
    request_started.disconnect(ready)

# Подключаем наш обработчик к сигналу запуска запроса
request_started.connect(ready, dispatch_uid="accounts.handlers.ready") 