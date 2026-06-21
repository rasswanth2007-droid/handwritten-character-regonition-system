from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import os
from .serializers import DatasetSerializer, DatasetCreateSerializer, MLModelSerializer, MLModelCreateSerializer, TrainingHistorySerializer
from .services import ModelTrainer
from apps.core.models import Dataset, MLModel, TrainingHistory


class DatasetListView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DatasetCreateSerializer
        return DatasetSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Dataset.objects.all()
        elif user.role == 'researcher':
            return Dataset.objects.filter(uploaded_by=user)
        return Dataset.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class DatasetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DatasetSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Dataset.objects.all()
        elif user.role == 'researcher':
            return Dataset.objects.filter(uploaded_by=user)
        return Dataset.objects.none()


class MLModelListView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MLModelCreateSerializer
        return MLModelSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return MLModel.objects.all()
        elif user.role == 'researcher':
            return MLModel.objects.filter(trained_by=user)
        return MLModel.objects.filter(is_deployed=True)
    
    def perform_create(self, serializer):
        serializer.save(trained_by=self.request.user)


class MLModelDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MLModelSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return MLModel.objects.all()
        elif user.role == 'researcher':
            return MLModel.objects.filter(trained_by=user)
        return MLModel.objects.filter(is_deployed=True)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_model(request):
    """Train a new model"""
    if request.user.role not in ['admin', 'researcher']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    model_type = request.data.get('model_type', 'combined')
    epochs = int(request.data.get('epochs', 10))
    batch_size = int(request.data.get('batch_size', 32))
    learning_rate = float(request.data.get('learning_rate', 0.001))
    model_name = request.data.get('name', f'{model_type}_model')
    
    # Initialize trainer
    trainer = ModelTrainer(model_type=model_type)
    
    # Train model
    try:
        model, metrics, training_history = trainer.train_model(
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2
        )
        
        # Save model
        model_filename = f"{model_name}_{model_type}.pt"
        model_path = os.path.join(settings.MODEL_PATH, model_filename)
        os.makedirs(settings.MODEL_PATH, exist_ok=True)
        trainer.save_model(model_path)
        
        # Create MLModel record
        ml_model = MLModel.objects.create(
            name=model_name,
            description=f"Trained {model_type} model (EMNIST Balanced, 47 classes)",
            model_type=model_type,
            version="2.0.0",
            file_path=model_path,
            architecture={
                'framework': 'pytorch',
                'input_shape': [1, 28, 28],
                'output_classes': trainer.num_classes
            },
            trained_by=request.user,
            accuracy=metrics['accuracy'],
            precision=metrics['precision'],
            recall=metrics['recall'],
            f1_score=metrics['f1_score'],
            training_loss=metrics['training_loss'],
            validation_loss=metrics['validation_loss'],
            epochs=epochs,
            batch_size=batch_size,
            learning_rate=learning_rate,
            is_active=False,
            is_deployed=False
        )
        
        # Save training history
        for epoch in range(training_history['epochs']):
            TrainingHistory.objects.create(
                model=ml_model,
                epoch=epoch + 1,
                training_loss=training_history['training_loss'][epoch],
                training_accuracy=training_history['training_accuracy'][epoch],
                validation_loss=training_history['validation_loss'][epoch],
                validation_accuracy=training_history['validation_accuracy'][epoch]
            )
        
        return Response({
            'model_id': str(ml_model.id),
            'metrics': metrics,
            'training_history': training_history,
            'message': 'Model trained successfully'
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deploy_model(request, model_id):
    """Deploy a model"""
    if request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        model = MLModel.objects.get(id=model_id)
        
        # Undeploy all other models
        MLModel.objects.filter(is_deployed=True).update(is_deployed=False, is_active=False)
        
        # Deploy this model
        model.is_deployed = True
        model.is_active = True
        model.save()
        
        return Response({'message': f'Model {model.name} deployed successfully'})
    except MLModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def model_training_history(request, model_id):
    """Get training history for a model"""
    try:
        model = MLModel.objects.get(id=model_id)
        history = TrainingHistory.objects.filter(model=model).order_by('epoch')
        serializer = TrainingHistorySerializer(history, many=True)
        return Response(serializer.data)
    except MLModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=status.HTTP_404_NOT_FOUND)
