from rest_framework import serializers
from apps.core.models import Dataset, MLModel, TrainingHistory


class DatasetSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = Dataset
        fields = [
            'id', 'name', 'description', 'dataset_type', 'file',
            'total_samples', 'uploaded_by', 'uploaded_by_username',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'total_samples', 'created_at']


class DatasetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['name', 'description', 'dataset_type', 'file']


class MLModelSerializer(serializers.ModelSerializer):
    trained_by_username = serializers.CharField(source='trained_by.username', read_only=True)
    dataset_name = serializers.CharField(source='training_dataset.name', read_only=True)
    
    class Meta:
        model = MLModel
        fields = [
            'id', 'name', 'description', 'model_type', 'version',
            'file_path', 'architecture', 'training_dataset', 'dataset_name',
            'trained_by', 'trained_by_username', 'accuracy', 'precision',
            'recall', 'f1_score', 'training_loss', 'validation_loss',
            'epochs', 'batch_size', 'learning_rate', 'is_active',
            'is_deployed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MLModelCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLModel
        fields = [
            'name', 'description', 'model_type', 'version',
            'training_dataset', 'epochs', 'batch_size', 'learning_rate'
        ]


class TrainingHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingHistory
        fields = ['id', 'model', 'epoch', 'training_loss', 'training_accuracy',
                  'validation_loss', 'validation_accuracy']
        read_only_fields = ['id']
