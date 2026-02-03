import os
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
urlpatterns = [
    path('coworking/', TemplateView.as_view(template_name='index.html'), name='coworking'),
    path('accounts/', include('allauth.urls')),
    path("", include("accounts.urls")),
    path('admin/', admin.site.urls),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if os.getenv("ENABLE_SILK", "False") == "True":
    urlpatterns.append(path('silk/', include('silk.urls', namespace='silk')))
handler404 = "accounts.views.custom_404"
