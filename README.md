# Handwritten Digit and Alphabet Recognition Using Deep Learning

A production-ready web application that recognizes handwritten digits (0–9) and alphabets (A–Z) using Convolutional Neural Networks (CNN), with **multi-character segmentation** for recognizing whole words and lines.

## Features

- **Character Recognition**: Recognizes digits (0-9), uppercase letters (A-Z), and 11 distinguishable lowercase letters with high accuracy (~88-90% on EMNIST Balanced)
- **Multi-Character Recognition**: Automatically segments and reads multiple characters from a single image, preserving reading order
- **Multiple Input Methods**: Drawing canvas, image upload, and webcam capture
- **Real-time Predictions**: Instant character recognition with per-character confidence scores
- **Model Training**: Train and manage custom models using EMNIST Balanced dataset
- **Analytics Dashboard**: Comprehensive visualization of prediction statistics and model performance
- **Role-Based Access Control**: Admin, Researcher, and User roles with appropriate permissions
- **Prediction History**: Track and view all predictions with detailed metadata

## Technology Stack

### Frontend
- React.js 18
- TailwindCSS
- Plotly.js for visualizations
- Axios for API calls

### Backend
- Django 4.2
- Django REST Framework
- SQLite / PostgreSQL
- JWT Authentication

### Deep Learning
- **PyTorch** (CNN trained on EMNIST Balanced — 47 classes)
- OpenCV for image segmentation and preprocessing

### Deployment
- Docker
- Docker Compose
- Nginx

## How It Works

### Recognition Pipeline
1. **Binarization**: Input image is converted to binary using Otsu thresholding
2. **Segmentation**: Connected components are found and merged (e.g., dot of 'i' with stem)
3. **Line Detection**: Characters are clustered into text lines and sorted left-to-right
4. **Normalization**: Each character is cropped, padded to square, and resized to 28×28
5. **Classification**: All characters are batched through the CNN for efficient inference
6. **Mapping**: Predictions are mapped back to characters via the EMNIST Balanced mapping

### Character Coverage (47 classes)
- All 10 digits: `0-9`
- All 26 uppercase letters: `A-Z`
- 11 lowercase letters with distinct shapes: `a, b, d, e, f, g, h, n, q, r, t`
- 15 lowercase letters folded into uppercase (inherent to EMNIST Balanced): `c,i,j,k,l,m,o,p,s,u,v,w,x,y,z`

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hdc
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python setup_new_model.py   # Copies trained model + runs migrations
python manage.py createsuperuser
python manage.py runserver
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Docker Deployment**
```bash
docker-compose up -d
```

## API Documentation

API documentation is available at `/api/docs/` when running the backend server.

## Default Credentials

- **Admin**: admin / admin123
- **Researcher**: researcher / researcher123
- **User**: user / user123

## Project Structure

```
hdc/
├── backend/                 # Django backend
│   ├── config/             # Django settings and configuration
│   ├── apps/
│   │   ├── authentication/ # User authentication and authorization
│   │   ├── recognition/    # Character recognition (PyTorch)
│   │   ├── training/       # Model training and management
│   │   ├── analytics/      # Analytics and reporting
│   │   └── core/           # Core utilities and models
│   ├── ml/                 # Machine learning
│   │   ├── emnist_model.py        # CNN architecture + mapping
│   │   ├── recognition_engine.py  # Segmentation + recognition
│   │   ├── checkpoints/           # Trained model checkpoints
│   │   └── train_model.py         # Standalone training script
│   ├── media/              # Uploaded images
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   └── utils/          # Utility functions
│   └── package.json
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── docker-compose.yml
```

## License

MIT License
