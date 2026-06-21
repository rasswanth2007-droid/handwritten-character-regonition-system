from rest_framework import serializers


class CharacterFrequencySerializer(serializers.Serializer):
    character = serializers.CharField()
    count = serializers.IntegerField()


class PredictionStatsSerializer(serializers.Serializer):
    total_predictions = serializers.IntegerField()
    correct_predictions = serializers.IntegerField()
    accuracy = serializers.FloatField()
    avg_confidence = serializers.FloatField()


class ModelPerformanceSerializer(serializers.Serializer):
    model_id = serializers.UUIDField()
    model_name = serializers.CharField()
    accuracy = serializers.FloatField()
    precision = serializers.FloatField()
    recall = serializers.FloatField()
    f1_score = serializers.FloatField()
