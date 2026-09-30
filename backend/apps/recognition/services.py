"""
Recognition service — bridges Django views with the PyTorch EMNIST model.

Replaces the old TensorFlow-based service with:
  - Proper Otsu binarization (instead of hard-coded threshold)
  - EMNIST Balanced 47-class model (instead of broken MNIST+EMNIST merge)
  - Multi-character segmentation (instead of one-image-one-character)
  - Correct centering/padding (matching how EMNIST training data is framed)
"""
import os
import numpy as np
from PIL import Image

from django.conf import settings

from ml.recognition_engine import (
    load_binary_from_pil,
    recognize_single_character,
    recognize_multi_character,
    get_model,
)


# ── Default checkpoint path ────────────────────────────────────────────

def _find_checkpoint() -> str:
    """Find the best available EMNIST checkpoint."""
    candidates = [
        # Primary: the EMNIST Balanced trained checkpoint
        os.path.join(settings.BASE_DIR, 'ml', 'checkpoints', 'emnist_balanced.pt'),
        # Fallback: if placed at project root
        os.path.join(settings.BASE_DIR, 'checkpoint.pt'),
        # Fallback: the d&a rec sys trained checkpoint
        r'd:\projects\d&a rec sys\checkpoint.pt',
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    raise FileNotFoundError(
        "No EMNIST checkpoint found. Please run train.py first or copy "
        "checkpoint.pt into backend/ml/checkpoints/emnist_balanced.pt"
    )


# ── Image preprocessing ────────────────────────────────────────────────

class ImagePreprocessor:
    @staticmethod
    def preprocess_image(image_file, target_size=(28, 28)):
        """Preprocess image for CNN prediction using proper EMNIST pipeline.
        
        Returns:
            preprocessed_binary: Binary image (strokes=255, bg=0)
            pil_image: The original PIL image for reference
        """
        # Read image
        image = Image.open(image_file)
        
        # Convert to binary using Otsu thresholding (auto-invert)
        binary = load_binary_from_pil(image)
        
        return binary, image


# ── Character recognizer ────────────────────────────────────────────────

class CharacterRecognizer:
    def __init__(self, model_path=None):
        self.checkpoint_path = model_path or _find_checkpoint()
        self.device = 'cpu'  # CPU is fast enough for inference on 28x28
        
        # Load model info to populate class metadata
        info = get_model(self.checkpoint_path, self.device)
        self.classes = info['mapping']
        self.num_classes = info['num_classes']
        self.model_accuracy = info.get('val_acc')
    
    def predict(self, binary_image):
        """Recognize character(s) from a preprocessed binary image.
        
        Automatically decides between single-char and multi-char mode:
        - If the image contains multiple separable components, runs
          the full segmentation pipeline
        - Otherwise, treats the whole image as a single character
        """
        result = recognize_multi_character(
            binary_image,
            self.checkpoint_path,
            min_area=12,
            device=self.device,
        )
        return result
    
    def predict_single(self, binary_image):
        """Force single-character recognition (legacy compatibility)."""
        return recognize_single_character(
            binary_image,
            self.checkpoint_path,
            device=self.device,
        )
    
    def predict_batch(self, binary_images):
        """Make predictions on multiple binary images."""
        results = []
        for binary in binary_images:
            result = self.predict(binary)
            results.append(result)
        return results


