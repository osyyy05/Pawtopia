from django.urls import path
from .views import AnimalListCreateView, AnimalDetailView

urlpatterns = [
    path('', AnimalListCreateView.as_view(), name='animal-list'),
    path('<int:pk>/', AnimalDetailView.as_view(), name='animal-detail'),
]