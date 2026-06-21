# Workflow and Data Flow

## 1. Character Recognition Workflow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Draw/Upload Image
       ▼
┌─────────────────────┐
│  Frontend (React)   │
│  - Canvas Component │
│  - File Upload      │
└──────┬──────────────┘
       │
       │ 2. Send Image (FormData)
       ▼
┌─────────────────────┐
│  Nginx Reverse      │
│  Proxy              │
└──────┬──────────────┘
       │
       │ 3. Route to /api/recognition/predict/
       ▼
┌─────────────────────┐
│  Django Backend     │
│  - Authentication   │
│  - Validation       │
└──────┬──────────────┘
       │
       │ 4. Image Preprocessing
       ▼
┌─────────────────────┐
│  ImagePreprocessor  │
│  - Grayscale        │
│  - Resize (28x28)   │
│  - Normalize        │
│  - Threshold        │
└──────┬──────────────┘
       │
       │ 5. Load Model
       ▼
┌─────────────────────┐
│  CharacterRecognizer│
│  - Load CNN Model   │
│  - Predict         │
└──────┬──────────────┘
       │
       │ 6. Get Predictions
       ▼
┌─────────────────────┐
│  Prediction Result   │
│  - Character        │
│  - Confidence       │
│  - Top 5            │
└──────┬──────────────┘
       │
       │ 7. Save to Database
       ▼
┌─────────────────────┐
│  PostgreSQL         │
│  - Prediction Table │
└──────┬──────────────┘
       │
       │ 8. Return Response
       ▼
┌─────────────────────┐
│  Frontend Display   │
│  - Show Result      │
│  - Update History  │
└─────────────────────┘
```

## 2. Model Training Workflow

```
┌─────────────┐
│ Researcher  │
└──────┬──────┘
       │
       │ 1. Select Training Parameters
       ▼
┌─────────────────────┐
│  Training Form      │
│  - Model Type      │
│  - Epochs          │
│  - Batch Size      │
│  - Learning Rate   │
└──────┬──────────────┘
       │
       │ 2. Submit Training Request
       ▼
┌─────────────────────┐
│  POST /api/training/train/
└──────┬──────────────┘
       │
       │ 3. Initialize ModelTrainer
       ▼
┌─────────────────────┐
│  ModelTrainer       │
│  - Load Dataset     │
│  - Create CNN       │
└──────┬──────────────┘
       │
       │ 4. Load Training Data
       ▼
┌─────────────────────┐
│  Dataset Loader     │
│  - MNIST (Digits)   │
│  - EMNIST (Letters) │
│  - Combined         │
└──────┬──────────────┘
       │
       │ 5. Data Augmentation
       ▼
┌─────────────────────┐
│  Augmentation       │
│  - Rotation         │
│  - Zoom             │
│  - Translation      │
└──────┬──────────────┘
       │
       │ 6. Train Model
       ▼
┌─────────────────────┐
│  Training Loop      │
│  - Forward Pass     │
│  - Loss Calculation │
│  - Backpropagation  │
│  - Weight Update    │
└──────┬──────────────┘
       │
       │ 7. Validate & Evaluate
       ▼
┌─────────────────────┐
│  Evaluation         │
│  - Accuracy         │
│  - Precision        │
│  - Recall           │
│  - F1 Score         │
└──────┬──────────────┘
       │
       │ 8. Save Model
       ▼
┌─────────────────────┐
│  Model Storage      │
│  - .h5 File        │
│  - Metrics JSON    │
└──────┬──────────────┘
       │
       │ 9. Save to Database
       ▼
┌─────────────────────┐
│  MLModel Record     │
│  - Model Info       │
│  - Metrics         │
│  - Training History│
└──────┬──────────────┘
       │
       │ 10. Return Results
       ▼
┌─────────────────────┐
│  Training Complete  │
│  - Display Metrics │
│  - Show Charts     │
└─────────────────────┘
```

## 3. Prediction Workflow (Detailed)

### Step 1: Input Capture
- **Canvas Input**: User draws character on HTML5 canvas
- **Upload Input**: User selects image file (PNG, JPG, JPEG)
- **Webcam Input**: User captures image from webcam (future)

### Step 2: Image Preprocessing
```python
def preprocess_image(image_file, target_size=(28, 28)):
    # 1. Read image
    image = Image.open(image_file)
    
    # 2. Convert to grayscale
    image = image.convert('L')
    
    # 3. Convert to numpy array
    image_array = np.array(image)
    
    # 4. Apply thresholding (invert for black on white)
    _, binary = cv2.threshold(image_array, 127, 255, cv2.THRESH_BINARY_INV)
    
    # 5. Resize to target size
    resized = cv2.resize(binary, target_size, interpolation=cv2.INTER_AREA)
    
    # 6. Normalize to [0, 1]
    normalized = resized / 255.0
    
    # 7. Reshape for model input (1, 28, 28, 1)
    reshaped = normalized.reshape(1, target_size[0], target_size[1], 1)
    
    return reshaped, binary
```

### Step 3: Model Inference
```python
def predict(preprocessed_image):
    # 1. Load model
    model = load_model(model_path)
    
    # 2. Make prediction
    predictions = model.predict(preprocessed_image)
    
    # 3. Get top prediction
    predicted_index = np.argmax(predictions[0])
    confidence = predictions[0][predicted_index]
    
    # 4. Get top 5 predictions
    top_indices = np.argsort(predictions[0])[-5:][::-1]
    top_predictions = {
        classes[i]: predictions[0][i]
        for i in top_indices
    }
    
    return {
        'character': classes[predicted_index],
        'confidence': confidence,
        'top_predictions': top_predictions
    }
```

### Step 4: Result Storage
```python
# Save prediction record
prediction = Prediction.objects.create(
    user=request.user,
    image=image_file,
    predicted_character=result['character'],
    confidence_score=result['confidence'],
    top_predictions=result['top_predictions'],
    input_method='canvas'
)
```

## 4. Authentication Workflow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Submit Credentials
       ▼
┌─────────────────────┐
│  POST /api/auth/login/
│  {username, password}│
└──────┬──────────────┘
       │
       │ 2. Validate Credentials
       ▼
┌─────────────────────┐
│  Django Auth        │
│  - Check Username   │
│  - Verify Password  │
└──────┬──────────────┘
       │
       │ 3. Generate JWT Tokens
       ▼
┌─────────────────────┐
│  SimpleJWT          │
│  - Access Token     │
│  - Refresh Token    │
└──────┬──────────────┘
       │
       │ 4. Return Tokens + User Info
       ▼
┌─────────────────────┐
│  Frontend Storage   │
│  - localStorage     │
│  - Axios Interceptor│
└──────┬──────────────┘
       │
       │ 5. Include Token in Requests
       ▼
┌─────────────────────┐
│  Protected API      │
│  - Validate Token   │
│  - Check Role      │
└─────────────────────┘
```

## 5. Analytics Data Flow

```
┌─────────────────────┐
│  Prediction Data    │
│  (PostgreSQL)       │
└──────┬──────────────┘
       │
       │ 1. Query Aggregations
       ▼
┌─────────────────────┐
│  Django ORM         │
│  - Count            │
│  - Avg              │
│  - Group By         │
└──────┬──────────────┘
       │
       │ 2. Process Data
       ▼
┌─────────────────────┐
│  Analytics Views    │
│  - Calculate Stats  │
│  - Format Data      │
└──────┬──────────────┘
       │
       │ 3. Generate Charts
       ▼
┌─────────────────────┐
│  Plotly.js          │
│  - Bar Charts       │
│  - Line Charts      │
│  - Histograms       │
└──────┬──────────────┘
       │
       │ 4. Return JSON
       ▼
┌─────────────────────┐
│  Frontend Display   │
│  - React-Plotly     │
│  - Interactive Viz  │
└─────────────────────┘
```

## 6. Data Flow Diagrams

### User Registration Flow
```
User → Register Form → POST /api/auth/register/
→ Django User Creation → Hash Password → Save to DB
→ Return Success → Redirect to Login
```

### Model Deployment Flow
```
Admin → Select Model → POST /api/training/models/{id}/deploy/
→ Update MLModel (is_deployed=True, is_active=True)
→ Undeploy Other Models → Update Nginx Config (optional)
→ Return Success
```

### Batch Prediction Flow
```
User → Upload Multiple Images → POST /api/recognition/batch-predict/
→ Process Each Image → Preprocess → Predict
→ Save All Predictions → Return Results Array
→ Display Results Table
```

## 7. Error Handling Flow

```
API Request
    │
    ├─→ Authentication Failed
    │      └─→ 401 Unauthorized
    │
    ├─→ Authorization Failed
    │      └─→ 403 Forbidden
    │
    ├─→ Validation Error
    │      └─→ 400 Bad Request
    │
    ├─→ Model Not Found
    │      └─→ 404 Not Found
    │
    ├─→ Server Error
    │      └─→ 500 Internal Server Error
    │
    └─→ Success
           └─→ 200 OK / 201 Created
```
