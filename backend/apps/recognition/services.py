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

# ── Gemini Vision Ensemble Engine ─────────────────────────────────────────
#
# Architecture: "Confidence-Gated Dual Engine"
#   1. PyTorch CNN always runs first (fast, free, local)
#   2. If ALL per-character confidences are above the gate threshold,
#      trust PyTorch alone — no API call needed
#   3. If ANY character falls below the threshold, send the original
#      image to Gemini Vision for a second opinion
#   4. Gemini's answer becomes the final prediction
#

from google import genai
from decouple import config

# Confidence threshold: if any character is below this, call Gemini
CONFIDENCE_GATE_THRESHOLD = 0.90


class GeminiVisionEngine:
    """Gemini Vision engine for verifying/correcting PyTorch OCR predictions."""

    def __init__(self):
        api_key = config("GEMINI_API_KEY", default="")
        self.is_configured = False
        if api_key:
            try:
                self.client = genai.Client(api_key=api_key)
                self.model_name = "gemini-2.5-flash"
                self.is_configured = True
                print("✓ Gemini Vision Engine initialized successfully")
            except Exception as e:
                print(f"✗ Failed to configure Gemini: {e}")

    def should_call_gemini(self, prediction_result: dict) -> bool:
        """Determine if Gemini should be called based on PyTorch confidence.
        
        Returns True if ANY character has confidence below the gate threshold,
        meaning PyTorch is uncertain and needs a second opinion.
        """
        # Always call Gemini if there are multi-char lines with low confidence
        if 'lines' in prediction_result:
            for line in prediction_result['lines']:
                for conf in line.get('confidences', []):
                    if conf < CONFIDENCE_GATE_THRESHOLD:
                        return True
            return False

        # Single character: check overall confidence
        overall_conf = prediction_result.get('confidence_score', 0)
        return overall_conf < CONFIDENCE_GATE_THRESHOLD

    def vision_predict(self, pil_image) -> str:
        """Send the original image to Gemini Vision for independent reading."""
        if not self.is_configured:
            return None

        prompt = (
            "You are an expert handwriting recognition AI. "
            "Look at this image and transcribe exactly what is written. "
            "The image may contain handwritten digits (0-9), uppercase letters (A-Z), "
            "lowercase letters, or a combination. "
            "If there are multiple lines, separate them with a newline character. "
            "Do NOT output any conversational text, explanations, or formatting. "
            "ONLY output the exact characters/text shown in the image, nothing else."
        )

        try:
            # Convert to RGB for Gemini compatibility
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt, pil_image],
            )
            corrected = response.text.strip()

            print(f"[Gemini Vision] Raw output: '{corrected}'")

            # Safety: reject empty or markdown-wrapped responses
            if not corrected or "```" in corrected:
                return None

            return corrected
        except Exception as e:
            print(f"[Gemini Vision] API call failed: {e}")
            return None

    def ensemble(self, prediction_result: dict, pil_image) -> dict:
        """Run the full Confidence-Gated Dual Engine pipeline.
        
        Args:
            prediction_result: The raw output dict from PyTorch CNN
            pil_image: The original uploaded PIL Image (not binarized)
            
        Returns:
            Updated prediction_result dict with Gemini corrections applied
        """
        pytorch_text = prediction_result.get('predicted_character', '')
        
        # Check confidence gate
        needs_gemini = self.should_call_gemini(prediction_result)

        if not needs_gemini:
            print(f"[Ensemble] PyTorch confident enough ({pytorch_text}), skipping Gemini")
            prediction_result['correction_source'] = 'pytorch'
            prediction_result['raw_pytorch_prediction'] = pytorch_text
            return prediction_result

        print(f"[Ensemble] PyTorch uncertain ({pytorch_text}), calling Gemini Vision...")

        # Call Gemini Vision
        gemini_text = self.vision_predict(pil_image)

        if gemini_text is None:
            # Gemini failed or returned garbage — fall back to PyTorch
            print("[Ensemble] Gemini returned nothing, keeping PyTorch result")
            prediction_result['correction_source'] = 'pytorch'
            prediction_result['raw_pytorch_prediction'] = pytorch_text
            return prediction_result

        # Gemini succeeded — use its answer as the final prediction
        print(f"[Ensemble] PyTorch: '{pytorch_text}' → Gemini: '{gemini_text}'")
        
        prediction_result['raw_pytorch_prediction'] = pytorch_text
        prediction_result['predicted_character'] = gemini_text
        prediction_result['correction_source'] = 'gemini'

        return prediction_result
