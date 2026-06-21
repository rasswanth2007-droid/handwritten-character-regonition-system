from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('researcher', 'Researcher'),
        ('user', 'User'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    class Meta:
        db_table = 'users'


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class Prediction(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='predictions')
    image = models.ImageField(upload_to='predictions/')
    predicted_character = models.CharField(max_length=255)
    confidence_score = models.FloatField()
    top_predictions = models.JSONField(default=dict)
    input_method = models.CharField(max_length=20, choices=[
        ('canvas', 'Canvas'),
        ('upload', 'Upload'),
        ('webcam', 'Webcam'),
    ])
    is_correct = models.BooleanField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.predicted_character} ({self.confidence_score:.2f})"
    
    class Meta:
        db_table = 'predictions'
        ordering = ['-created_at']


class Dataset(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    dataset_type = models.CharField(max_length=20, choices=[
        ('digits', 'Digits (MNIST)'),
        ('alphabets', 'Alphabets (EMNIST)'),
        ('custom', 'Custom'),
    ])
    file = models.FileField(upload_to='datasets/')
    total_samples = models.IntegerField(default=0)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_datasets')
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.dataset_type})"
    
    class Meta:
        db_table = 'datasets'


class MLModel(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    model_type = models.CharField(max_length=20, choices=[
        ('digits', 'Digits'),
        ('alphabets', 'Alphabets'),
        ('combined', 'Combined'),
    ])
    version = models.CharField(max_length=50)
    file_path = models.CharField(max_length=500)
    architecture = models.JSONField(default=dict)
    training_dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, related_name='models')
    trained_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trained_models')
    
    # Training metrics
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    training_loss = models.FloatField(null=True, blank=True)
    validation_loss = models.FloatField(null=True, blank=True)
    
    # Training details
    epochs = models.IntegerField(default=10)
    batch_size = models.IntegerField(default=32)
    learning_rate = models.FloatField(default=0.001)
    
    is_active = models.BooleanField(default=False)
    is_deployed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.name} v{self.version}"
    
    class Meta:
        db_table = 'ml_models'
        ordering = ['-created_at']


class TrainingHistory(BaseModel):
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='training_history')
    epoch = models.IntegerField()
    training_loss = models.FloatField()
    training_accuracy = models.FloatField()
    validation_loss = models.FloatField()
    validation_accuracy = models.FloatField()
    
    class Meta:
        db_table = 'training_history'
        ordering = ['epoch']
