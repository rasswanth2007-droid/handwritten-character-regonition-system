from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from django.http import HttpResponse

def backend_status_view(request):
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>HDC Backend Status</title>
        <style>
            body { font-family: sans-serif; background-color: white; color: black; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        </style>
    </head>
    <body>
        <h1>Backend running</h1>
    </body>
    </html>
    """
    return HttpResponse(html)

def health_check_view(request):
    return HttpResponse("OK")

urlpatterns = [
    path('', backend_status_view, name='backend_status'),
    path('api/healthz/', health_check_view, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/recognition/', include('apps.recognition.urls')),
    path('api/training/', include('apps.training.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
