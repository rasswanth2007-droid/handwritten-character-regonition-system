from django.urls import path
from .views import (
    dashboard_stats,
    character_frequency_chart,
    prediction_timeline,
    confidence_distribution,
    model_comparison,
    training_progress,
    dataset_stats
)

urlpatterns = [
    path('dashboard/', dashboard_stats, name='dashboard_stats'),
    path('charts/character-frequency/', character_frequency_chart, name='character_frequency'),
    path('charts/prediction-timeline/', prediction_timeline, name='prediction_timeline'),
    path('charts/confidence-distribution/', confidence_distribution, name='confidence_distribution'),
    path('charts/model-comparison/', model_comparison, name='model_comparison'),
    path('training-progress/<uuid:model_id>/', training_progress, name='training_progress'),
    path('dataset-stats/', dataset_stats, name='dataset_stats'),
]
