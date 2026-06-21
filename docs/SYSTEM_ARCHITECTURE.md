# System Architecture - Handwritten Character Recognition System

## 1. High-Level Architecture

The system follows a microservices-inspired architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  React.js Frontend (Drawing Canvas, Image Upload, Dashboard) │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      API Gateway (Nginx)                      │
│              Reverse Proxy & Load Balancer                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────────┐ ┌──▼──────────┐ ┌─▼──────────────────┐
│  Django REST   │ │  React SPA   │ │  Static Files      │
│     API        │ │   (Build)    │ │  (Media/Static)    │
└───────┬────────┘ └─────────────┘ └────────────────────┘
        │
        ├──────────────┬──────────────┬──────────────┐
        │              │              │              │
┌───────▼────────┐ ┌─▼──────────┐ ┌─▼──────────┐ ┌─▼──────────┐
│  PostgreSQL    │ │   Redis    │ │   TensorFlow│ │  OpenCV    │
│   Database      │ │  (Celery)  │ │   Models    │ │  (Image)   │
└────────────────┘ └────────────┘ └────────────┘ └────────────┘
```

## 2. Frontend Layer

### Technology Stack
- **Framework**: React.js 18
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Visualization**: Plotly.js, Recharts
- **Canvas**: react-canvas-draw

### Components Structure
```
src/
├── components/
│   ├── Navbar.js          # Navigation bar with role-based menu
│   └── ProtectedRoute.js  # Route protection wrapper
├── pages/
│   ├── Login.js           # User authentication
│   ├── Register.js        # User registration
│   ├── Dashboard.js       # Main dashboard with stats
│   ├── CanvasDraw.js      # Drawing canvas for input
│   ├── ImageUpload.js     # Image upload interface
│   ├── PredictionHistory.js # View past predictions
│   ├── Analytics.js       # Analytics dashboard
│   ├── AdminPanel.js      # Admin management interface
│   └── ModelTraining.js   # Model training interface
├── context/
│   └── AuthContext.js     # Authentication state management
└── services/
    └── api.js             # API service layer with interceptors
```

## 3. Backend Layer

### Technology Stack
- **Framework**: Django 4.2
- **API Framework**: Django REST Framework
- **Authentication**: JWT (SimpleJWT)
- **Task Queue**: Celery with Redis
- **Image Processing**: OpenCV, PIL

### Django Apps Structure
```
backend/
├── config/                # Django settings and configuration
│   ├── settings.py        # Main settings
│   ├── urls.py            # URL routing
│   ├── wsgi.py            # WSGI configuration
│   └── asgi.py            # ASGI configuration
├── apps/
│   ├── core/              # Core models and utilities
│   │   ├── models.py      # User, Prediction, Dataset, MLModel
│   │   └── admin.py       # Django admin configuration
│   ├── authentication/    # User authentication
│   │   ├── serializers.py # Request/response serializers
│   │   ├── views.py       # Authentication views
│   │   └── urls.py        # Authentication URLs
│   ├── recognition/       # Character recognition
│   │   ├── services.py    # Image preprocessing & prediction
│   │   ├── serializers.py # Prediction serializers
│   │   ├── views.py       # Prediction views
│   │   └── urls.py        # Recognition URLs
│   ├── training/          # Model training
│   │   ├── services.py    # Model training logic
│   │   ├── serializers.py # Training serializers
│   │   ├── views.py       # Training views
│   │   └── urls.py        # Training URLs
│   └── analytics/         # Analytics & reporting
│       ├── views.py       # Analytics views
│       └── urls.py        # Analytics URLs
└── ml/                    # Machine learning models
    ├── models/            # Trained model files
    └── train_model.py     # Standalone training script
```

## 4. Database Layer

### PostgreSQL Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    role VARCHAR(20) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Predictions Table
```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    image VARCHAR(500) NOT NULL,
    predicted_character CHAR(1) NOT NULL,
    confidence_score FLOAT NOT NULL,
    top_predictions JSONB,
    input_method VARCHAR(20) NOT NULL,
    is_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Datasets Table
```sql
CREATE TABLE datasets (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_type VARCHAR(20) NOT NULL,
    file VARCHAR(500) NOT NULL,
    total_samples INTEGER DEFAULT 0,
    uploaded_by_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ML Models Table
```sql
CREATE TABLE ml_models (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(20) NOT NULL,
    version VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    architecture JSONB,
    training_dataset_id UUID REFERENCES datasets(id),
    trained_by_id UUID REFERENCES users(id),
    accuracy FLOAT,
    precision FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    training_loss FLOAT,
    validation_loss FLOAT,
    epochs INTEGER DEFAULT 10,
    batch_size INTEGER DEFAULT 32,
    learning_rate FLOAT DEFAULT 0.001,
    is_active BOOLEAN DEFAULT FALSE,
    is_deployed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Training History Table
```sql
CREATE TABLE training_history (
    id UUID PRIMARY KEY,
    model_id UUID REFERENCES ml_models(id),
    epoch INTEGER NOT NULL,
    training_loss FLOAT NOT NULL,
    training_accuracy FLOAT NOT NULL,
    validation_loss FLOAT NOT NULL,
    validation_accuracy FLOAT NOT NULL
);
```

## 5. Deep Learning Layer

### CNN Architecture

```
Input Layer: (28, 28, 1) - Grayscale image
    │
    ▼
Conv2D(32, 3x3) + ReLU + BatchNorm
    │
    ▼
Conv2D(32, 3x3) + ReLU + BatchNorm
    │
    ▼
MaxPooling2D(2x2) + Dropout(0.25)
    │
    ▼
Conv2D(64, 3x3) + ReLU + BatchNorm
    │
    ▼
Conv2D(64, 3x3) + ReLU + BatchNorm
    │
    ▼
MaxPooling2D(2x2) + Dropout(0.25)
    │
    ▼
Conv2D(128, 3x3) + ReLU + BatchNorm
    │
    ▼
MaxPooling2D(2x2) + Dropout(0.25)
    │
    ▼
Flatten
    │
    ▼
Dense(256) + ReLU + BatchNorm + Dropout(0.5)
    │
    ▼
Dense(128) + ReLU + BatchNorm + Dropout(0.5)
    │
    ▼
Dense(36) + Softmax
    │
    ▼
Output: 36 classes (0-9, A-Z)
```

### Model Parameters
- **Total Parameters**: ~1.2M
- **Input Shape**: (28, 28, 1)
- **Output Classes**: 36 (10 digits + 26 letters)
- **Activation Functions**: ReLU (hidden), Softmax (output)
- **Loss Function**: Sparse Categorical Crossentropy
- **Optimizer**: Adam (learning_rate=0.001)
- **Regularization**: Dropout, Batch Normalization

## 6. Deployment Layer

### Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Nginx      │  │   Frontend    │  │  Backend   │ │
│  │   :80        │  │   :3000       │  │   :8000    │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                  │                │         │
│         └──────────────────┼────────────────┘         │
│                            │                          │
│  ┌──────────────┐  ┌──────▼──────┐  ┌────────────┐ │
│  │  PostgreSQL   │  │    Redis    │  │   Shared   │ │
│  │    :5432      │  │    :6379    │  │   Volumes  │ │
│  └──────────────┘  └─────────────┘  └────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Container Specifications

1. **Nginx Container**
   - Image: nginx:alpine
   - Port: 80
   - Role: Reverse proxy, static file serving

2. **Frontend Container**
   - Base: node:18-alpine
   - Port: 3000
   - Framework: React.js

3. **Backend Container**
   - Base: python:3.9-slim
   - Port: 8000
   - Framework: Django + Gunicorn

4. **PostgreSQL Container**
   - Image: postgres:14-alpine
   - Port: 5432
   - Volume: Persistent data storage

5. **Redis Container**
   - Image: redis:7-alpine
   - Port: 6379
   - Role: Celery broker, caching

## 7. Security Architecture

### Authentication Flow
```
1. User submits credentials → /api/auth/login/
2. Server validates credentials
3. Server generates JWT access token (60 min) + refresh token (7 days)
4. Client stores tokens in localStorage
5. Client includes access token in Authorization header
6. Server validates token on each request
7. On token expiry, client uses refresh token to get new access token
```

### Role-Based Access Control (RBAC)
- **Admin**: Full system access, user management, model deployment
- **Researcher**: Dataset upload, model training, view analytics
- **User**: Make predictions, view own history

### Security Measures
- Password hashing (PBKDF2)
- JWT token validation
- SQL injection prevention (ORM)
- XSS protection (input validation, output encoding)
- CSRF protection (Django middleware)
- Rate limiting (future enhancement)
- HTTPS enforcement (production)
