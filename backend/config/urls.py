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
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f111a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; padding: 3rem; background-color: #1e222e; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); border: 1px solid #2d313f; }
            h1 { color: #818cf8; margin-bottom: 0.5rem; letter-spacing: -0.025em; }
            p { color: #94a3b8; margin-bottom: 1.5rem; }
            .status { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600; border: 1px solid rgba(16, 185, 129, 0.2); }
            .dot { width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 12px #10b981; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>HDC AI Engine</h1>
            <p>PyTorch & Gemini Vision API are successfully connected.</p>
            <div class="status"><div class="dot"></div> System Active & Listening</div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)

urlpatterns = [
    path('', backend_status_view, name='backend_status'),
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
