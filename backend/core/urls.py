from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('accounts.urls')),

    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),

    path('api/animals/', include('animals.urls')),
    path('api/donations/', include('donations.urls')),
    path('api/news/', include('news.urls')),
    path('api/training/', include('training.urls')),
    path('api/adoptions/', include('adoptions.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/community/', include('community.urls')),
]


# Serve uploaded files during development
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )