# Testing Strategy

## 1. Testing Overview

The testing strategy covers unit testing, integration testing, model testing, and user acceptance testing to ensure the system is production-ready.

### Testing Pyramid
```
        ┌─────────────┐
        │    E2E      │  10%
        │  (Selenium) │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ Integration │  30%
        │   (API)     │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │    Unit     │  60%
        │  (pytest)   │
        └─────────────┘
```

---

## 2. Unit Testing

### Backend Unit Tests

#### Test Structure
```
backend/
├── apps/
│   ├── authentication/
│   │   └── tests/
│   │       ├── test_serializers.py
│   │       ├── test_views.py
│   │       └── test_models.py
│   ├── recognition/
│   │   └── tests/
│   │       ├── test_services.py
│   │       ├── test_views.py
│   │       └── test_preprocessing.py
│   ├── training/
│   │   └── tests/
│   │       ├── test_services.py
│   │       └── test_views.py
│   └── analytics/
│       └── tests/
│           └── test_views.py
```

#### Example Unit Tests

**Authentication Tests**
```python
# apps/authentication/tests/test_views.py
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
    
    def test_login_failure(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, 401)
```

**Recognition Service Tests**
```python
# apps/recognition/tests/test_services.py
import numpy as np
from django.test import TestCase
from apps.recognition.services import ImagePreprocessor, CharacterRecognizer

class ImagePreprocessorTest(TestCase):
    def test_preprocess_image(self):
        # Create test image
        test_image = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
        
        preprocessor = ImagePreprocessor()
        preprocessed, binary = preprocessor.preprocess_image(test_image)
        
        self.assertEqual(preprocessed.shape, (1, 28, 28, 1))
        self.assertTrue(np.all(preprocessed >= 0) and np.all(preprocessed <= 1))
```

### Frontend Unit Tests

#### Test Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.test.js
│   │   └── ProtectedRoute.test.js
│   ├── pages/
│   │   ├── Login.test.js
│   │   ├── Dashboard.test.js
│   │   └── CanvasDraw.test.js
│   └── services/
│       └── api.test.js
```

#### Example Unit Tests

**API Service Tests**
```javascript
// src/services/api.test.js
import { recognitionAPI } from './api';
import axios from 'axios';

jest.mock('axios');

describe('recognitionAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('predict should call correct endpoint', async () => {
    const mockResponse = {
      data: {
        predicted_character: 'A',
        confidence_score: 0.95
      }
    };
    axios.post.mockResolvedValue(mockResponse);

    const formData = new FormData();
    formData.append('image', new Blob());
    formData.append('input_method', 'canvas');

    const result = await recognitionAPI.predict(formData);

    expect(axios.post).toHaveBeenCalledWith(
      '/api/recognition/predict/',
      formData,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'multipart/form-data'
        })
      })
    );
    expect(result.data).toEqual(mockResponse.data);
  });
});
```

**Component Tests**
```javascript
// src/components/Navbar.test.js
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthProvider } from '../context/AuthContext';

describe('Navbar', () => {
  test('renders navigation links', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });
});
```

### Running Unit Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test

# Coverage report
cd backend
coverage run --source='.' manage.py test
coverage report
```

---

## 3. Integration Testing

### API Integration Tests

```python
# backend/apps/recognition/tests/test_integration.py
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
import io

User = get_user_model()

class PredictionIntegrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            role='user'
        )
        # Login and get token
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_prediction_flow(self):
        # Create test image
        image_content = io.BytesIO(b'\x47\x49\x46\x38\x39\x61')
        image = SimpleUploadedFile(
            "test.png",
            image_content.getvalue(),
            content_type="image/png"
        )
        
        # Make prediction
        response = self.client.post('/api/recognition/predict/', {
            'image': image,
            'input_method': 'upload'
        }, format='multipart')
        
        self.assertEqual(response.status_code, 201)
        self.assertIn('predicted_character', response.data)
        self.assertIn('confidence_score', response.data)
        
        # Verify prediction was saved
        prediction_id = response.data['id']
        detail_response = self.client.get(f'/api/recognition/predictions/{prediction_id}/')
        self.assertEqual(detail_response.status_code, 200)
```

### Database Integration Tests

```python
# backend/apps/core/tests/test_models.py
from django.test import TestCase
from apps.core.models import User, Prediction, MLModel
from django.utils import timezone

class ModelIntegrationTest(TestCase):
    def test_prediction_user_relationship(self):
        user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        prediction = Prediction.objects.create(
            user=user,
            predicted_character='A',
            confidence_score=0.95,
            input_method='canvas'
        )
        
        self.assertEqual(prediction.user, user)
        self.assertEqual(user.predictions.count(), 1)
```

---

## 4. Model Testing

### Model Accuracy Testing

```python
# backend/ml/tests/test_model_accuracy.py
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.metrics import accuracy_score, classification_report

class ModelAccuracyTest(TestCase):
    def setUp(self):
        # Load trained model
        self.model = load_model('ml/models/combined_model.h5')
        self.classes = list('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    
    def test_mnist_accuracy(self):
        # Load MNIST test data
        (_, _), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
        x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
        
        # Make predictions
        predictions = self.model.predict(x_test[:1000], verbose=0)
        y_pred = np.argmax(predictions, axis=1)
        
        # Calculate accuracy
        accuracy = accuracy_score(y_test[:1000], y_pred)
        
        # Assert minimum accuracy threshold
        self.assertGreater(accuracy, 0.95, 
                          f"MNIST accuracy {accuracy} below threshold 0.95")
    
    def test_prediction_confidence(self):
        # Test that confidence scores are reasonable
        test_image = np.random.rand(1, 28, 28, 1).astype('float32')
        predictions = self.model.predict(test_image, verbose=0)
        
        max_confidence = np.max(predictions)
        self.assertGreater(max_confidence, 0.0)
        self.assertLessEqual(max_confidence, 1.0)
        
        # Test that probabilities sum to 1
        sum_probs = np.sum(predictions[0])
        self.assertAlmostEqual(sum_probs, 1.0, places=5)
```

### Model Performance Testing

```python
# backend/ml/tests/test_model_performance.py
import time
import numpy as np

class ModelPerformanceTest(TestCase):
    def setUp(self):
        self.model = load_model('ml/models/combined_model.h5')
    
    def test_inference_speed(self):
        # Test single prediction speed
        test_image = np.random.rand(1, 28, 28, 1).astype('float32')
        
        start_time = time.time()
        self.model.predict(test_image, verbose=0)
        end_time = time.time()
        
        inference_time = end_time - start_time
        self.assertLess(inference_time, 0.1, 
                       f"Inference time {inference_time} exceeds 100ms")
    
    def test_batch_prediction_speed(self):
        # Test batch prediction speed
        batch_size = 32
        test_images = np.random.rand(batch_size, 28, 28, 1).astype('float32')
        
        start_time = time.time()
        self.model.predict(test_images, verbose=0)
        end_time = time.time()
        
        inference_time = end_time - start_time
        avg_time_per_image = inference_time / batch_size
        self.assertLess(avg_time_per_image, 0.05,
                       f"Avg inference time {avg_time_per_image} exceeds 50ms")
```

---

## 5. End-to-End Testing

### Selenium E2E Tests

```python
# tests/e2e/test_prediction_flow.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class PredictionE2ETest:
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get('http://localhost:3000')
    
    def test_login_and_predict(self):
        # Login
        username_input = self.driver.find_element(By.NAME, 'username')
        password_input = self.driver.find_element(By.NAME, 'password')
        
        username_input.send_keys('testuser')
        password_input.send_keys('testpass123')
        
        login_button = self.driver.find_element(By.XPATH, '//button[text()="Sign In"]')
        login_button.click()
        
        # Wait for dashboard
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, '//h1[text()="Dashboard"]'))
        )
        
        # Navigate to canvas
        canvas_link = self.driver.find_element(By.XPATH, '//a[text()="Draw"]')
        canvas_link.click()
        
        # Draw on canvas (simplified)
        canvas = self.driver.find_element(By.TAG_NAME, 'canvas')
        # Add canvas drawing logic here
        
        # Click predict
        predict_button = self.driver.find_element(By.XPATH, '//button[text()="Predict Character"]')
        predict_button.click()
        
        # Wait for result
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'prediction-result'))
        )
        
        # Verify result is displayed
        result = self.driver.find_element(By.CLASS_NAME, 'prediction-result')
        self.assertIsNotNone(result)
    
    def tearDown(self):
        self.driver.quit()
```

### Cypress E2E Tests (Alternative)

```javascript
// cypress/integration/prediction.spec.js
describe('Prediction Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should login and make prediction', () => {
    // Login
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('testpass123')
    cy.get('button').contains('Sign In').click()
    
    // Navigate to canvas
    cy.contains('Draw').click()
    cy.url().should('include', '/canvas')
    
    // Draw on canvas
    cy.get('canvas')
      .trigger('mousedown', 100, 100)
      .trigger('mousemove', 150, 150)
      .trigger('mouseup')
    
    // Predict
    cy.contains('Predict Character').click()
    
    // Verify result
    cy.get('.prediction-result').should('be.visible')
    cy.get('.predicted-character').should('not.be.empty')
  })
})
```

---

## 6. User Acceptance Testing (UAT)

### UAT Test Plan

#### Test Scenarios

**1. User Registration and Login**
- [ ] User can register with valid credentials
- [ ] User receives confirmation message
- [ ] User can login with registered credentials
- [ ] Invalid credentials show error message
- [ ] Password validation works correctly

**2. Character Recognition - Canvas**
- [ ] User can draw on canvas
- [ ] Canvas can be cleared
- [ ] Drawing can be downloaded
- [ ] Prediction returns character
- [ ] Confidence score is displayed
- [ ] Top 5 predictions are shown

**3. Character Recognition - Upload**
- [ ] User can upload image file
- [ ] Image preview is displayed
- [ ] Invalid file types are rejected
- [ ] Large files are rejected
- [ ] Prediction returns character
- [ ] Result is saved to history

**4. Prediction History**
- [ ] User can view prediction history
- [ ] History shows all predictions
- [ ] User can view prediction details
- [ ] Pagination works correctly
- [ ] Filters work correctly

**5. Analytics Dashboard**
- [ ] Dashboard shows correct statistics
- [ ] Charts are displayed correctly
- [ ] Charts are interactive
- [ ] Data is accurate
- [ ] Charts can be downloaded

**6. Admin Panel**
- [ ] Admin can view all users
- [ ] Admin can delete users
- [ ] Admin cannot delete self
- [ ] User statistics are accurate
- [ ] Role-based access works

**7. Model Training**
- [ ] Researcher can train model
- [ ] Training parameters are validated
- [ ] Training progress is shown
- [ ] Training completes successfully
- [ ] Model metrics are displayed
- [ ] Model can be deployed

### UAT Sign-off Criteria

- All critical test scenarios pass
- No critical bugs remaining
- Performance meets requirements
- Security audit passed
- Documentation is complete
- User feedback is positive

---

## 7. Performance Testing

### Load Testing with Locust

```python
# locustfile.py
from locust import HttpUser, task, between

class PredictionUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post('/api/auth/login/', json={
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = response.json()['access']
    
    @task(3)
    def predict_character(self):
        headers = {'Authorization': f'Bearer {self.token}'}
        # Create test image
        self.client.post('/api/recognition/predict/', 
                       headers=headers,
                       files={'image': open('test_image.png', 'rb')})
    
    @task(1)
    def view_history(self):
        headers = {'Authorization': f'Bearer {self.token}'}
        self.client.get('/api/recognition/predictions/', headers=headers)
```

### Running Load Tests

```bash
# Install locust
pip install locust

# Run locust
locust -f locustfile.py --host=http://localhost:8000

# Target: 100 users, spawn rate 10 users/second
# Duration: 5 minutes
```

### Performance Targets

- **Response Time**: < 500ms for predictions
- **Throughput**: 100 predictions/second
- **Error Rate**: < 1%
- **Concurrent Users**: 1000
- **Uptime**: 99.9%

---

## 8. Security Testing

### Security Test Checklist

- [ ] SQL injection testing
- [ ] XSS vulnerability testing
- [ ] CSRF protection testing
- [ ] Authentication bypass testing
- [ ] Authorization testing
- [ ] File upload security testing
- [ ] API rate limiting testing
- [ ] Dependency vulnerability scanning
- [ ] SSL/TLS configuration testing
- [ ] Session security testing

### Security Tools

```bash
# OWASP ZAP for web application security
zap-cli quick-scan --self-contained http://localhost:8000

# Bandit for Python security
bandit -r backend/

# npm audit for JavaScript security
npm audit

# pip-audit for Python dependencies
pip-audit
```

---

## 9. Test Automation

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run backend tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      
      - name: Set up Node
        uses: actions/setup-node@v2
        with:
          node-version: 18
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 10. Test Reporting

### Coverage Reports

```bash
# Backend coverage
cd backend
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report

# Frontend coverage
cd frontend
npm test -- --coverage --watchAll=false
```

### Test Metrics

- **Code Coverage**: > 80%
- **Test Pass Rate**: > 95%
- **Test Execution Time**: < 10 minutes
- **Flaky Tests**: 0

### Test Documentation

- Test cases documented in test files
- Test results archived
- Bug reports linked to failing tests
- Test plan reviewed and approved
