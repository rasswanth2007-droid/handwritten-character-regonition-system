from django.contrib import admin
from .models import User, Prediction, Dataset, MLModel, TrainingHistory


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['username', 'email']


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ['user', 'predicted_character', 'confidence_score', 'input_method', 'created_at']
    list_filter = ['predicted_character', 'input_method', 'created_at']
    search_fields = ['user__username', 'predicted_character']


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ['name', 'dataset_type', 'total_samples', 'is_active', 'created_at']
    list_filter = ['dataset_type', 'is_active', 'created_at']
    search_fields = ['name']


@admin.register(MLModel)
class MLModelAdmin(admin.ModelAdmin):
    list_display = ['name', 'version', 'model_type', 'accuracy', 'is_active', 'is_deployed', 'created_at']
    list_filter = ['model_type', 'is_active', 'is_deployed', 'created_at']
    search_fields = ['name', 'version']


@admin.register(TrainingHistory)
class TrainingHistoryAdmin(admin.ModelAdmin):
    list_display = ['model', 'epoch', 'training_accuracy', 'validation_accuracy']
    list_filter = ['model']
