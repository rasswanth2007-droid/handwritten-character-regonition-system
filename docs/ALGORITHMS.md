# Algorithms

## 1. Image Preprocessing Algorithm

### Algorithm: Character Image Preprocessing

**Input:** Raw image file (PNG, JPG, JPEG)
**Output:** Preprocessed tensor (1, 28, 28, 1)

```
ALGORITHM PreprocessImage(image_file, target_size=(28, 28))
    INPUT: image_file, target_size
    OUTPUT: preprocessed_tensor, binary_image
    
    1. Read image using PIL
       image = Image.open(image_file)
    
    2. Convert to grayscale
       image = image.convert('L')
    
    3. Convert to numpy array
       image_array = np.array(image)
    
    4. Apply thresholding (invert for black on white)
       threshold_value = 127
       max_value = 255
       binary = cv2.threshold(image_array, threshold_value, 
                            max_value, cv2.THRESH_BINARY_INV)
    
    5. Resize to target dimensions
       resized = cv2.resize(binary, target_size, 
                          interpolation=cv2.INTER_AREA)
    
    6. Normalize pixel values to [0, 1]
       normalized = resized / 255.0
    
    7. Reshape for CNN input (batch, height, width, channels)
       reshaped = normalized.reshape(1, target_size[0], 
                                    target_size[1], 1)
    
    8. Return preprocessed tensor and binary image
       RETURN reshaped, binary
END ALGORITHM
```

### Time Complexity: O(n) where n is the number of pixels
### Space Complexity: O(n) for storing the image arrays

---

## 2. CNN-Based Character Recognition Algorithm

### Algorithm: Character Classification using CNN

**Input:** Preprocessed image tensor (1, 28, 28, 1)
**Output:** Predicted character, confidence score, top predictions

```
ALGORITHM RecognizeCharacter(preprocessed_image, model)
    INPUT: preprocessed_image, model
    OUTPUT: prediction_result
    
    1. Load CNN model
       IF model_path exists:
           model = load_model(model_path)
       ELSE:
           model = create_default_model()
    
    2. Perform forward pass through CNN
       predictions = model.predict(preprocessed_image)
    
    3. Extract predicted class index
       predicted_index = argmax(predictions[0])
    
    4. Calculate confidence score
       confidence = predictions[0][predicted_index]
    
    5. Get top 5 prediction probabilities
       top_indices = argsort(predictions[0])[-5:][::-1]
       top_predictions = {}
       FOR each index IN top_indices:
           character = classes[index]
           probability = predictions[0][index]
           top_predictions[character] = probability
    
    6. Map index to character
       predicted_character = classes[predicted_index]
    
    7. Construct result object
       result = {
           'predicted_character': predicted_character,
           'confidence_score': confidence,
           'top_predictions': top_predictions
       }
    
    8. Return result
       RETURN result
END ALGORITHM
```

### CNN Forward Pass Details:
```
Layer 1: Conv2D(32, 3x3) → ReLU → BatchNorm
  Output: (26, 26, 32)
  Parameters: 320

Layer 2: Conv2D(32, 3x3) → ReLU → BatchNorm
  Output: (24, 24, 32)
  Parameters: 9,248

Layer 3: MaxPooling2D(2x2) → Dropout(0.25)
  Output: (12, 12, 32)
  Parameters: 0

Layer 4: Conv2D(64, 3x3) → ReLU → BatchNorm
  Output: (10, 10, 64)
  Parameters: 18,496

Layer 5: Conv2D(64, 3x3) → ReLU → BatchNorm
  Output: (8, 8, 64)
  Parameters: 36,928

Layer 6: MaxPooling2D(2x2) → Dropout(0.25)
  Output: (4, 4, 64)
  Parameters: 0

Layer 7: Conv2D(128, 3x3) → ReLU → BatchNorm
  Output: (2, 2, 128)
  Parameters: 73,856

Layer 8: MaxPooling2D(2x2) → Dropout(0.25)
  Output: (1, 1, 128)
  Parameters: 0

Layer 9: Flatten
  Output: (128,)
  Parameters: 0

Layer 10: Dense(256) → ReLU → BatchNorm → Dropout(0.5)
  Output: (256,)
  Parameters: 33,024

Layer 11: Dense(128) → ReLU → BatchNorm → Dropout(0.5)
  Output: (128,)
  Parameters: 32,896

Layer 12: Dense(36) → Softmax
  Output: (36,)
  Parameters: 4,644

Total Parameters: ~209,412
```

### Time Complexity: O(1) - Fixed computation for fixed model architecture
### Space Complexity: O(1) - Fixed memory for model parameters

---

## 3. Confidence Score Calculation Algorithm

### Algorithm: Calculate Prediction Confidence

**Input:** Prediction probabilities array (36,)
**Output:** Confidence score (0-1)

```
ALGORITHM CalculateConfidence(predictions)
    INPUT: predictions (array of 36 probabilities)
    OUTPUT: confidence_score
    
    1. Find maximum probability
       max_prob = max(predictions)
    
    2. Calculate entropy (uncertainty measure)
       entropy = -sum(p * log2(p) for p in predictions if p > 0)
    
    3. Normalize entropy to [0, 1]
       max_entropy = log2(36)  # Maximum possible entropy
       normalized_entropy = entropy / max_entropy
    
    4. Calculate confidence (inverse of uncertainty)
       confidence = max_prob * (1 - normalized_entropy)
    
    5. Ensure confidence is in [0, 1]
       confidence = max(0, min(1, confidence))
    
    6. Return confidence
       RETURN confidence
END ALGORITHM
```

### Alternative Simple Confidence:
```
ALGORITHM SimpleConfidence(predictions)
    INPUT: predictions
    OUTPUT: confidence
    
    1. Find maximum probability
       confidence = max(predictions)
    
    2. Return confidence
       RETURN confidence
END ALGORITHM
```

### Time Complexity: O(n) where n is the number of classes (36)
### Space Complexity: O(1)

---

## 4. Model Training Algorithm

### Algorithm: CNN Model Training with Backpropagation

**Input:** Training data, validation data, hyperparameters
**Output:** Trained model, metrics, training history

```
ALGORITHM TrainModel(x_train, y_train, x_val, y_val, hyperparameters)
    INPUT: x_train, y_train, x_val, y_val, hyperparameters
    OUTPUT: trained_model, metrics, training_history
    
    1. Initialize hyperparameters
       epochs = hyperparameters.epochs
       batch_size = hyperparameters.batch_size
       learning_rate = hyperparameters.learning_rate
    
    2. Create CNN model architecture
       model = create_cnn_model()
    
    3. Compile model with optimizer and loss
       model.compile(
           optimizer=Adam(learning_rate=learning_rate),
           loss='sparse_categorical_crossentropy',
           metrics=['accuracy']
       )
    
    4. Define callbacks
       callbacks = [
           EarlyStopping(patience=5, restore_best_weights=True),
           ReduceLROnPlateau(factor=0.5, patience=3),
           ModelCheckpoint(save_best_only=True)
       ]
    
    5. Initialize training history
       training_history = {
           'loss': [],
           'accuracy': [],
           'val_loss': [],
           'val_accuracy': []
       }
    
    6. Training loop
       FOR epoch FROM 1 TO epochs:
           
           a. Shuffle training data
              indices = random_permutation(len(x_train))
              x_train_shuffled = x_train[indices]
              y_train_shuffled = y_train[indices]
           
           b. Mini-batch training
              FOR batch_start FROM 0 TO len(x_train) STEP batch_size:
                  batch_end = batch_start + batch_size
                  x_batch = x_train_shuffled[batch_start:batch_end]
                  y_batch = y_train_shuffled[batch_start:batch_end]
                  
                  # Forward pass
                  predictions = model.predict(x_batch)
                  
                  # Calculate loss
                  loss = calculate_loss(predictions, y_batch)
                  
                  # Backpropagation
                  gradients = compute_gradients(loss)
                  
                  # Update weights
                  optimizer.apply_gradients(gradients)
           
           c. Evaluate on training set
              train_loss, train_acc = model.evaluate(x_train, y_train)
           
           d. Evaluate on validation set
              val_loss, val_acc = model.evaluate(x_val, y_val)
           
           e. Record metrics
              training_history['loss'].append(train_loss)
              training_history['accuracy'].append(train_acc)
              training_history['val_loss'].append(val_loss)
              training_history['val_accuracy'].append(val_acc)
           
           f. Check early stopping
              IF val_loss has not improved for 5 epochs:
                  BREAK training loop
           
           g. Adjust learning rate if needed
              IF val_loss has plateaued:
                  learning_rate = learning_rate * 0.5
    
    7. Final evaluation on test set
       test_loss, test_accuracy = model.evaluate(x_test, y_test)
    
    8. Calculate additional metrics
       y_pred = model.predict(x_test)
       y_pred_classes = argmax(y_pred, axis=1)
       
       precision = calculate_precision(y_test, y_pred_classes)
       recall = calculate_recall(y_test, y_pred_classes)
       f1_score = 2 * (precision * recall) / (precision + recall)
    
    9. Construct metrics object
       metrics = {
           'accuracy': test_accuracy,
           'precision': precision,
           'recall': recall,
           'f1_score': f1_score,
           'training_loss': training_history['loss'][-1],
           'validation_loss': training_history['val_loss'][-1]
       }
    
    10. Return results
        RETURN model, metrics, training_history
END ALGORITHM
```

### Data Augmentation Algorithm:
```
ALGORITHM AugmentData(image)
    INPUT: image
    OUTPUT: augmented_image
    
    1. Random rotation (-10° to +10°)
       angle = random(-10, 10)
       image = rotate(image, angle)
    
    2. Random zoom (0.9x to 1.1x)
       zoom_factor = random(0.9, 1.1)
       image = zoom(image, zoom_factor)
    
    3. Random translation (±10%)
       shift_x = random(-0.1, 0.1)
       shift_y = random(-0.1, 0.1)
       image = translate(image, shift_x, shift_y)
    
    4. Return augmented image
       RETURN image
END ALGORITHM
```

### Time Complexity: O(epochs * batches * n) where n is the dataset size
### Space Complexity: O(n) for storing the dataset and model parameters

---

## 5. Similar Character Handling Algorithm

### Algorithm: Resolve Ambiguous Characters

**Input:** Top predictions with probabilities
**Output:** Refined prediction with confidence adjustment

```
ALGORITHM ResolveSimilarCharacters(top_predictions, image_features)
    INPUT: top_predictions, image_features
    OUTPUT: refined_prediction
    
    1. Define similar character pairs
       similar_pairs = [
           ('0', 'O'),
           ('1', 'I', 'l'),
           ('5', 'S'),
           ('2', 'Z'),
           ('8', 'B')
       ]
    
    2. Check if top prediction is in a similar pair
       top_char = top_predictions[0].character
       top_conf = top_predictions[0].confidence
    
    3. FOR each pair IN similar_pairs:
           IF top_char IN pair:
               
               a. Get probabilities of all similar characters
                   similar_probs = [
                       top_predictions[char] 
                       for char in pair 
                       if char IN top_predictions
                   ]
               
               b. Calculate feature-based confidence
                   IF image_features.has_vertical_stroke:
                       adjust_confidence('I', +0.1)
                   IF image_features.has_curved_stroke:
                       adjust_confidence('O', +0.1)
               
               c. Re-rank based on adjusted confidence
                   refined_predictions = rerank(similar_probs)
               
               d. Return top refined prediction
                   RETURN refined_predictions[0]
    
    4. If no similar characters found, return original
       RETURN top_predictions[0]
END ALGORITHM
```

### Feature Extraction for Similar Characters:
```
ALGORITHM ExtractImageFeatures(binary_image)
    INPUT: binary_image (28x28)
    OUTPUT: features
    
    1. Calculate aspect ratio
       height = count_nonzero_pixels_per_column()
       width = count_nonzero_pixels_per_row()
       aspect_ratio = max(height) / max(width)
    
    2. Detect vertical strokes
       vertical_strokes = count_vertical_lines()
    
    3. Detect curved strokes
       curved_strokes = count_curved_components()
    
    4. Calculate density
       density = total_pixels / (28 * 28)
    
    5. Return features
       RETURN {
           'aspect_ratio': aspect_ratio,
           'vertical_strokes': vertical_strokes,
           'curved_strokes': curved_strokes,
           'density': density
       }
END ALGORITHM
```

---

## 6. Batch Prediction Algorithm

### Algorithm: Process Multiple Images Efficiently

**Input:** List of image files
**Output:** List of prediction results

```
ALGORITHM BatchPredict(image_files, model, batch_size=32)
    INPUT: image_files, model, batch_size
    OUTPUT: results
    
    1. Initialize results list
       results = []
    
    2. Preprocess all images
       preprocessed_images = []
       FOR each image_file IN image_files:
           preprocessed, _ = preprocess_image(image_file)
           preprocessed_images.append(preprocessed)
    
    3. Stack images into batch tensor
       batch_tensor = concatenate(preprocessed_images, axis=0)
    
    4. Process in mini-batches
       FOR i FROM 0 TO len(batch_tensor) STEP batch_size:
           batch_end = min(i + batch_size, len(batch_tensor))
           mini_batch = batch_tensor[i:batch_end]
           
           # Predict on mini-batch
           batch_predictions = model.predict(mini_batch)
           
           # Process each prediction
           FOR j FROM 0 TO len(mini_batch):
               pred = batch_predictions[j]
               predicted_index = argmax(pred)
               confidence = pred[predicted_index]
               
               top_indices = argsort(pred)[-5:][::-1]
               top_predictions = {
                   classes[k]: pred[k]
                   for k in top_indices
               }
               
               results.append({
                   'predicted_character': classes[predicted_index],
                   'confidence_score': confidence,
                   'top_predictions': top_predictions
               })
    
    5. Return results
       RETURN results
END ALGORITHM
```

### Time Complexity: O(n/batch_size) where n is the number of images
### Space Complexity: O(batch_size * image_size) for batch processing
