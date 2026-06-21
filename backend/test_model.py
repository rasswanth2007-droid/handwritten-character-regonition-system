import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import cv2

# Load the trained model
model_path = 'd:/projects/hdc/ml/models/digits_model_20260618_200003.h5'
print(f"Loading model from: {model_path}")
model = load_model(model_path)
print(f"Model loaded successfully")
print(f"Model output shape: {model.output_shape}")

# Create a simple test image - a digit "3"
# Create a 28x28 white image with a black "3" shape
test_image = np.zeros((28, 28), dtype=np.uint8)
test_image[:] = 0  # Black background

# Draw a simple "3" in white
# Top horizontal line
test_image[5:8, 8:20] = 255
# Middle horizontal line
test_image[12:15, 8:20] = 255
# Bottom horizontal line
test_image[19:22, 8:20] = 255
# Left vertical line (top)
test_image[5:12, 8:11] = 255
# Right vertical line (top)
test_image[5:12, 17:20] = 255
# Left vertical line (bottom)
test_image[15:22, 8:11] = 255
# Right vertical line (bottom)
test_image[15:22, 17:20] = 255

# Normalize and reshape
test_image_normalized = test_image / 255.0
test_image_reshaped = test_image_normalized.reshape(1, 28, 28, 1)

print(f"Test image shape: {test_image_reshaped.shape}")
print(f"Test image min/max: {test_image_reshaped.min()}/{test_image_reshaped.max()}")

# Make prediction
predictions = model.predict(test_image_reshaped, verbose=0)
print(f"Raw predictions: {predictions[0]}")
predicted_index = np.argmax(predictions[0])
confidence = float(predictions[0][predicted_index])
print(f"Predicted index: {predicted_index}")
print(f"Predicted character: {predicted_index}")
print(f"Confidence: {confidence}")

# Test with a digit "7"
test_image_7 = np.zeros((28, 28), dtype=np.uint8)
test_image_7[:] = 0  # Black background
# Draw a simple "7" in white
# Top horizontal line
test_image_7[5:8, 8:20] = 255
# Diagonal line
for i in range(8, 22):
    test_image_7[i, i-3:i] = 255

test_image_7_normalized = test_image_7 / 255.0
test_image_7_reshaped = test_image_7_normalized.reshape(1, 28, 28, 1)

predictions_7 = model.predict(test_image_7_reshaped, verbose=0)
print(f"\nTest digit 7:")
print(f"Raw predictions: {predictions_7[0]}")
predicted_index_7 = np.argmax(predictions_7[0])
confidence_7 = float(predictions_7[0][predicted_index_7])
print(f"Predicted index: {predicted_index_7}")
print(f"Predicted character: {predicted_index_7}")
print(f"Confidence: {confidence_7}")
