# API Design

## Base URL
```
Development: http://localhost:8000/api/
Production: https://your-domain.com/api/
```

## Authentication Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 1. Authentication APIs

### POST /api/auth/login/
Login user and receive JWT tokens.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "role": "admin",
  "email": "admin@example.com"
}
```

### POST /api/auth/token/refresh/
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /api/auth/register/
Register a new user.

**Request:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepass123",
  "password2": "securepass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "newuser",
    "email": "user@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "User registered successfully"
}
```

### GET /api/auth/profile/
Get current user profile.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "email": "admin@example.com",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin",
  "phone": "+1234567890",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### PATCH /api/auth/profile/
Update current user profile.

**Request:**
```json
{
  "first_name": "Updated",
  "phone": "+9876543210"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "email": "admin@example.com",
  "first_name": "Updated",
  "last_name": "User",
  "role": "admin",
  "phone": "+9876543210",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /api/auth/users/
Get all users (Admin only).

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### DELETE /api/auth/users/{user_id}/delete/
Delete a user (Admin only).

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

## 2. Image Upload & Prediction APIs

### POST /api/recognition/predict/
Predict character from uploaded image.

**Request (multipart/form-data):**
```
image: <file>
input_method: "canvas" | "upload" | "webcam"
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user": "550e8400-e29b-41d4-a716-446655440000",
  "user_username": "admin",
  "image": "/media/predictions/image_123.png",
  "predicted_character": "A",
  "confidence_score": 0.95,
  "top_predictions": {
    "A": 0.95,
    "4": 0.03,
    "H": 0.01,
    "K": 0.005,
    "R": 0.005
  },
  "input_method": "canvas",
  "is_correct": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/recognition/batch-predict/
Predict characters from multiple images.

**Request (multipart/form-data):**
```
images: <file1>, <file2>, <file3>, ...
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "predicted_character": "A",
      "confidence_score": 0.95,
      "top_predictions": {
        "A": 0.95,
        "4": 0.03
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "predicted_character": "5",
      "confidence_score": 0.88,
      "top_predictions": {
        "5": 0.88,
        "S": 0.08
      }
    }
  ]
}
```

### GET /api/recognition/predictions/
Get prediction history.

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20)

**Response (200 OK):**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/recognition/predictions/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "predicted_character": "A",
      "confidence_score": 0.95,
      "input_method": "canvas",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/recognition/predictions/{id}/
Get specific prediction details.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user": "550e8400-e29b-41d4-a716-446655440000",
  "user_username": "admin",
  "image": "/media/predictions/image_123.png",
  "predicted_character": "A",
  "confidence_score": 0.95,
  "top_predictions": {
    "A": 0.95,
    "4": 0.03
  },
  "input_method": "canvas",
  "is_correct": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 3. Model Management APIs

### GET /api/training/datasets/
Get all datasets.

**Response (200 OK):**
```json
{
  "count": 5,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "MNIST Dataset",
      "description": "Standard MNIST digit dataset",
      "dataset_type": "digits",
      "total_samples": 60000,
      "uploaded_by": "550e8400-e29b-41d4-a716-446655440000",
      "uploaded_by_username": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/training/datasets/
Upload a new dataset (Researcher/Admin only).

**Request (multipart/form-data):**
```
name: "Custom Dataset"
description: "My custom dataset"
dataset_type: "custom"
file: <file>
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Custom Dataset",
  "description": "My custom dataset",
  "dataset_type": "custom",
  "total_samples": 0,
  "uploaded_by": "550e8400-e29b-41d4-a716-446655440000",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /api/training/models/
Get all trained models.

**Response (200 OK):**
```json
{
  "count": 3,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Combined Model v1",
      "description": "Combined digit and alphabet model",
      "model_type": "combined",
      "version": "1.0.0",
      "accuracy": 0.98,
      "precision": 0.97,
      "recall": 0.97,
      "f1_score": 0.97,
      "is_active": true,
      "is_deployed": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/training/models/
Create a new model record (Researcher/Admin only).

**Request:**
```json
{
  "name": "New Model",
  "description": "Model description",
  "model_type": "combined",
  "version": "1.0.0",
  "training_dataset": "550e8400-e29b-41d4-a716-446655440000",
  "epochs": 20,
  "batch_size": 64,
  "learning_rate": 0.001
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "New Model",
  "description": "Model description",
  "model_type": "combined",
  "version": "1.0.0",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/training/train/
Train a new model (Researcher/Admin only).

**Request:**
```json
{
  "name": "combined_model_v2",
  "model_type": "combined",
  "epochs": 15,
  "batch_size": 32,
  "learning_rate": 0.001
}
```

**Response (201 Created):**
```json
{
  "model_id": "550e8400-e29b-41d4-a716-446655440000",
  "metrics": {
    "accuracy": 0.98,
    "precision": 0.97,
    "recall": 0.97,
    "f1_score": 0.97,
    "training_loss": 0.05,
    "validation_loss": 0.06
  },
  "training_history": {
    "epochs": 15,
    "training_loss": [0.5, 0.3, 0.2, 0.15, 0.1, 0.08, 0.07, 0.06, 0.05],
    "training_accuracy": [0.85, 0.90, 0.93, 0.95, 0.96, 0.97, 0.97, 0.98, 0.98],
    "validation_loss": [0.55, 0.35, 0.25, 0.18, 0.12, 0.10, 0.08, 0.07, 0.06],
    "validation_accuracy": [0.83, 0.88, 0.91, 0.94, 0.95, 0.96, 0.96, 0.97, 0.97]
  },
  "message": "Model trained successfully"
}
```

### POST /api/training/models/{id}/deploy/
Deploy a model (Admin only).

**Response (200 OK):**
```json
{
  "message": "Model Combined Model v1 deployed successfully"
}
```

### GET /api/training/models/{id}/history/
Get training history for a model.

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "model": "550e8400-e29b-41d4-a716-446655440000",
    "epoch": 1,
    "training_loss": 0.5,
    "training_accuracy": 0.85,
    "validation_loss": 0.55,
    "validation_accuracy": 0.83
  }
]
```

## 4. Analytics APIs

### GET /api/analytics/dashboard/
Get dashboard statistics.

**Response (200 OK):**
```json
{
  "total_predictions": 1250,
  "correct_predictions": 1180,
  "accuracy": 94.4,
  "avg_confidence": 0.92,
  "character_frequency": [
    {"predicted_character": "1", "count": 150},
    {"predicted_character": "A", "count": 120}
  ],
  "recent_predictions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "character": "A",
      "confidence": 0.95,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "active_model": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Combined Model v1",
    "accuracy": 0.98
  }
}
```

### GET /api/analytics/charts/character-frequency/
Get character frequency chart data.

**Response (200 OK):**
```json
{
  "chart": "{\"data\":[{\"type\":\"bar\",\"x\":[\"0\",\"1\",...],\"y\":[100,150,...]}],\"layout\":{...}}"
}
```

### GET /api/analytics/charts/prediction-timeline/
Get prediction timeline chart data.

**Response (200 OK):**
```json
{
  "chart": "{\"data\":[{\"type\":\"scatter\",\"x\":[\"2024-01-01\",...],\"y\":[50,60,...]}],\"layout\":{...}}"
}
```

### GET /api/analytics/charts/confidence-distribution/
Get confidence distribution chart data.

**Response (200 OK):**
```json
{
  "chart": "{\"data\":[{\"type\":\"histogram\",\"x\":[0.95,0.88,...]}],\"layout\":{...}}"
}
```

### GET /api/analytics/charts/model-comparison/
Get model comparison chart data (Researcher/Admin only).

**Response (200 OK):**
```json
{
  "chart": "{\"data\":[{\"type\":\"bar\",\"x\":[\"Model1\",\"Model2\"],\"y\":[0.98,0.95]}],\"layout\":{...}}"
}
```

### GET /api/analytics/training-progress/{model_id}/
Get training progress visualization (Researcher/Admin only).

**Response (200 OK):**
```json
{
  "loss_chart": "{\"data\":[{\"type\":\"scatter\",\"x\":[1,2,3],\"y\":[0.5,0.3,0.2]}],\"layout\":{...}}",
  "accuracy_chart": "{\"data\":[{\"type\":\"scatter\",\"x\":[1,2,3],\"y\":[0.85,0.90,0.93]}],\"layout\":{...}}"
}
```

### GET /api/analytics/dataset-stats/
Get dataset statistics (Researcher/Admin only).

**Response (200 OK):**
```json
{
  "total_datasets": 5,
  "total_samples": 120000,
  "dataset_types": [
    {"dataset_type": "digits", "count": 2},
    {"dataset_type": "alphabets", "count": 2},
    {"dataset_type": "custom", "count": 1}
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
