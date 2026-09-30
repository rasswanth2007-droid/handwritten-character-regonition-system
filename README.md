# Handwritten Digit and Alphabet Recognition Using Deep Learning

A production-ready web application that recognizes handwritten digits (0–9) and alphabets (A–Z) using Convolutional Neural Networks (CNN), with **multi-character segmentation** for recognizing whole words and lines.

## Core AI Technologies & Architecture

This project is powered by a robust blend of Computer Vision and Deep Learning technologies, specifically engineered to handle the unpredictability of real-world handwriting.

### 1. The Dataset: EMNIST ByMerge
- **Massive Scale:** Trained on the **EMNIST ByMerge** dataset, consisting of **814,255** handwritten character images (6x larger than EMNIST Balanced).
- **Imbalanced Learning:** Utilizes a `WeightedRandomSampler` to train effectively on natural, real-world class distributions rather than artificially balanced data.
- **47 Class Coverage:** Recognizes all digits (0-9), uppercase letters (A-Z), and distinct lowercase letters (a, b, d, e, f, g, h, n, q, r, t). Similar shapes (like 'C' and 'c') are merged to prevent model confusion.

### 2. Network Architecture: Residual CNN with Attention
- **Residual Connections:** Employs a custom ResNet-style architecture. Skip connections prevent the vanishing gradient problem, allowing the network to be deeper and learn more complex stroke representations.
- **Squeeze-and-Excitation (SE) Blocks:** Integrates a channel-based **Attention Mechanism**. SE blocks allow the network to "focus" on the most important parts of a character (like the crossing of a 't') and actively suppress background noise.
- **High Capacity:** The model boasts ~1.2 million parameters, providing the necessary capacity to differentiate between visually similar characters.

### 3. Advanced Training & Augmentation
- **Mixup & Cutout:** Uses advanced data augmentations. **Cutout** forces the model to recognize characters even when parts of the strokes are missing. **Mixup** blends images together, teaching the model to handle heavily distorted or messy handwriting.
- **OneCycleLR & Label Smoothing:** Uses the OneCycle Learning Rate policy for rapid convergence and escaping local minima, combined with Label Smoothing (0.1) to prevent overconfidence and drastically improve generalization on unseen test data.

### 4. Computer Vision Pipeline (OpenCV)
- **Adaptive Binarization:** Uses Otsu's thresholding to dynamically separate ink from background, regardless of lighting conditions.
- **Contour Segmentation & Heuristics:** Detects disconnected strokes (like the dot on an 'i') and intelligently merges them based on spatial proximity.
- **Reading Order Detection:** Automatically clusters characters into lines and sorts them left-to-right, seamlessly preserving the user's natural reading order.

## Features

- **High-Accuracy Recognition**: Achieves ~90.28% validation accuracy on the challenging EMNIST ByMerge dataset.
- **Multi-Character Support**: Draw or upload entire words/sentences.
- **Real-time Confidence Scoring**: Instantly returns predictions with per-character confidence metrics.
- **Analytics & History**: Track all predictions over time with a comprehensive dashboard.

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
