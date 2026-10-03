from django.urls import path
from .views import (
    PredictionView, PredictionListView, PredictionDetailView,
    PredictionFeedbackView, batch_predict,
    AdminPredictionListView, admin_delete_prediction,
)

urlpatterns = [
    path('predict/', PredictionView.as_view(), name='predict'),
    path('predictions/', PredictionListView.as_view(), name='prediction_list'),
    path('predictions/<uuid:id>/', PredictionDetailView.as_view(), name='prediction_detail'),
    path('predictions/<uuid:id>/feedback/', PredictionFeedbackView.as_view(), name='prediction_feedback'),
    path('batch-predict/', batch_predict, name='batch_predict'),
    # Admin-only endpoints
    path('admin/predictions/', AdminPredictionListView.as_view(), name='admin_prediction_list'),
    path('admin/predictions/<uuid:prediction_id>/delete/', admin_delete_prediction, name='admin_delete_prediction'),
]
