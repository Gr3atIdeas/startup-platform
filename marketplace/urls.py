from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Пути allauth для обработки логина через соцсети (Telegram).
    # Префикс /accounts/ необходим для корректной работы колбэков.
    path('accounts/', include('allauth.urls')),
    
    # Ваши основные пути (login, register, startups и т.д.)
    # подключаются в корень, чтобы работали URL без префикса.
    path("", include("accounts.urls")),
    
    # Админка
    path('admin/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = "accounts.views.custom_404"
