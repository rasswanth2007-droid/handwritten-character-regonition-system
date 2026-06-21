from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncDate
from apps.core.models import Prediction, MLModel, Dataset
from .serializers import CharacterFrequencySerializer, PredictionStatsSerializer, ModelPerformanceSerializer
import plotly.graph_objects as go
import plotly.express as px
import json
from datetime import datetime, timedelta


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get overall dashboard statistics"""
    user = request.user
    
    # Filter predictions based on user role
    if user.role == 'admin':
        predictions = Prediction.objects.all()
    else:
        predictions = Prediction.objects.filter(user=user)
    
    total_predictions = predictions.count()
    correct_predictions = predictions.filter(is_correct=True).count()
    accuracy = (correct_predictions / total_predictions * 100) if total_predictions > 0 else 0
    avg_confidence = predictions.aggregate(avg=Avg('confidence_score'))['avg'] or 0
    
    # Get character frequency
    char_frequency = predictions.values('predicted_character').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Get recent predictions
    recent_predictions = predictions.order_by('-created_at')[:10]
    
    # Get active model
    active_model = MLModel.objects.filter(is_active=True, is_deployed=True).first()
    
    return Response({
        'total_predictions': total_predictions,
        'correct_predictions': correct_predictions,
        'accuracy': round(accuracy, 2),
        'avg_confidence': round(avg_confidence, 2),
        'character_frequency': list(char_frequency),
        'recent_predictions': [
            {
                'id': str(p.id),
                'character': p.predicted_character,
                'confidence': p.confidence_score,
                'created_at': p.created_at.isoformat()
            }
            for p in recent_predictions
        ],
        'active_model': {
            'id': str(active_model.id),
            'name': active_model.name,
            'accuracy': active_model.accuracy
        } if active_model else None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def character_frequency_chart(request):
    """Generate character frequency distribution chart"""
    user = request.user
    
    if user.role == 'admin':
        predictions = Prediction.objects.all()
    else:
        predictions = Prediction.objects.filter(user=user)
    
    # Get character frequency
    char_data = predictions.values('predicted_character').annotate(
        count=Count('id')
    ).order_by('predicted_character')
    
    characters = [item['predicted_character'] for item in char_data]
    counts = [item['count'] for item in char_data]
    
    # Create bar chart
    fig = go.Figure(data=[go.Bar(x=characters, y=counts)])
    fig.update_layout(
        title='Character Frequency Distribution',
        xaxis_title='Character',
        yaxis_title='Count',
        template='plotly_dark'
    )
    
    return Response({'chart': fig.to_json()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_timeline(request):
    """Generate prediction timeline chart"""
    user = request.user
    
    if user.role == 'admin':
        predictions = Prediction.objects.all()
    else:
        predictions = Prediction.objects.filter(user=user)
    
    # Get predictions per day
    daily_data = predictions.annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    dates = [item['date'].isoformat() for item in daily_data]
    counts = [item['count'] for item in daily_data]
    
    # Create line chart
    fig = go.Figure(data=[go.Scatter(x=dates, y=counts, mode='lines+markers')])
    fig.update_layout(
        title='Predictions Over Time',
        xaxis_title='Date',
        yaxis_title='Number of Predictions',
        template='plotly_dark'
    )
    
    return Response({'chart': fig.to_json()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def confidence_distribution(request):
    """Generate confidence score distribution chart"""
    user = request.user
    
    if user.role == 'admin':
        predictions = Prediction.objects.all()
    else:
        predictions = Prediction.objects.filter(user=user)
    
    # Get confidence scores
    confidences = list(predictions.values_list('confidence_score', flat=True))
    
    # Create histogram
    fig = go.Figure(data=[go.Histogram(x=confidences, nbinsx=20)])
    fig.update_layout(
        title='Confidence Score Distribution',
        xaxis_title='Confidence Score',
        yaxis_title='Count',
        template='plotly_dark'
    )
    
    return Response({'chart': fig.to_json()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def model_comparison(request):
    """Compare multiple models performance"""
    if request.user.role not in ['admin', 'researcher']:
        return Response({'error': 'Permission denied'}, status=403)
    
    models = MLModel.objects.all().order_by('-created_at')[:10]
    
    model_names = [model.name for model in models]
    accuracies = [model.accuracy or 0 for model in models]
    
    # Create bar chart
    fig = go.Figure(data=[go.Bar(x=model_names, y=accuracies)])
    fig.update_layout(
        title='Model Performance Comparison',
        xaxis_title='Model',
        yaxis_title='Accuracy',
        template='plotly_dark'
    )
    
    return Response({'chart': fig.to_json()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_progress(request, model_id):
    """Get training progress visualization"""
    if request.user.role not in ['admin', 'researcher']:
        return Response({'error': 'Permission denied'}, status=403)
    
    try:
        model = MLModel.objects.get(id=model_id)
        history = model.training_history.all().order_by('epoch')
        
        epochs = [h.epoch for h in history]
        train_loss = [h.training_loss for h in history]
        val_loss = [h.validation_loss for h in history]
        train_acc = [h.training_accuracy for h in history]
        val_acc = [h.validation_accuracy for h in history]
        
        # Create loss chart
        loss_fig = go.Figure()
        loss_fig.add_trace(go.Scatter(x=epochs, y=train_loss, name='Training Loss', mode='lines+markers'))
        loss_fig.add_trace(go.Scatter(x=epochs, y=val_loss, name='Validation Loss', mode='lines+markers'))
        loss_fig.update_layout(
            title=f'Training Progress - {model.name}',
            xaxis_title='Epoch',
            yaxis_title='Loss',
            template='plotly_dark'
        )
        
        # Create accuracy chart
        acc_fig = go.Figure()
        acc_fig.add_trace(go.Scatter(x=epochs, y=train_acc, name='Training Accuracy', mode='lines+markers'))
        acc_fig.add_trace(go.Scatter(x=epochs, y=val_acc, name='Validation Accuracy', mode='lines+markers'))
        acc_fig.update_layout(
            title=f'Accuracy Progress - {model.name}',
            xaxis_title='Epoch',
            yaxis_title='Accuracy',
            template='plotly_dark'
        )
        
        return Response({
            'loss_chart': loss_fig.to_json(),
            'accuracy_chart': acc_fig.to_json()
        })
    except MLModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dataset_stats(request):
    """Get dataset statistics"""
    if request.user.role not in ['admin', 'researcher']:
        return Response({'error': 'Permission denied'}, status=403)
    
    datasets = Dataset.objects.all()
    
    total_datasets = datasets.count()
    total_samples = datasets.aggregate(total=Count('id'))['total'] or 0
    
    dataset_types = datasets.values('dataset_type').annotate(
        count=Count('id')
    )
    
    return Response({
        'total_datasets': total_datasets,
        'total_samples': total_samples,
        'dataset_types': list(dataset_types)
    })
