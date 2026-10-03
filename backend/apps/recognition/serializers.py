from rest_framework import serializers
from apps.core.models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'user', 'user_email', 'image', 'predicted_character',
            'confidence_score', 'top_predictions', 'input_method',
            'is_correct', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PredictionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = ['image', 'input_method']
