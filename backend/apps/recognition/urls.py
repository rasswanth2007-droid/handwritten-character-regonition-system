from django.urls import path
from .views import PredictionView, PredictionListView, PredictionDetailView, batch_predict

urlpatterns = [
    path('predict/', PredictionView.as_view(), name='predict'),
    path('predictions/', PredictionListView.as_view(), name='prediction_list'),
    path('predictions/<uuid:id>/', PredictionDetailView.as_view(), name='prediction_detail'),
    path('batch-predict/', batch_predict, name='batch_predict'),
]
