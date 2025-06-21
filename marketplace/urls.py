from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
urlpatterns = [
    path('login/', include('accounts.urls')),  # Для твоего /login/
    path("", include("accounts.urls")),
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),  # Полный путь для allauth
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
