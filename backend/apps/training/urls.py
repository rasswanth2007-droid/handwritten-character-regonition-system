from django.urls import path
from .views import (
    DatasetListView,
    DatasetDetailView,
    MLModelListView,
    MLModelDetailView,
    train_model,
    deploy_model,
    model_training_history
)

urlpatterns = [
    path('datasets/', DatasetListView.as_view(), name='dataset_list'),
    path('datasets/<uuid:id>/', DatasetDetailView.as_view(), name='dataset_detail'),
    path('models/', MLModelListView.as_view(), name='model_list'),
    path('models/<uuid:id>/', MLModelDetailView.as_view(), name='model_detail'),
    path('train/', train_model, name='train_model'),
    path('models/<uuid:model_id>/deploy/', deploy_model, name='deploy_model'),
    path('models/<uuid:model_id>/history/', model_training_history, name='model_history'),
]
