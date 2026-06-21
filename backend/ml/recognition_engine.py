"""
Multi-character segmentation and recognition engine.

Pipeline:
  1. Binarize input image (Otsu thresholding, auto-invert)
  2. Find connected components (contours)
  3. Merge character fragments (e.g. dot of 'i' with its stem)
  4. Cluster into text lines, sort left-to-right within each line
  5. Crop, pad-to-square, resize each character to 28x28
  6. Batch through the EMNIST CNN, map predictions to characters

Works well on:
  - Printed text or clearly-spaced handwriting
  - Single characters drawn on canvas

Does NOT work on:
  - Cursive/connected handwriting (requires sequence models like CRNN+CTC)
"""
from dataclasses import dataclass
from typing import List, Optional
import io

import cv2
import numpy as np
import torch

from .emnist_model import EMNISTCNN, EMNIST_BALANCED_MAPPING


# ── Data structures ─────────────────────────────────────────────────────

@dataclass
class CharBox:
    x: int
    y: int
    w: int
    h: int

    @property
    def x2(self):
        return self.x + self.w

    @property
    def y2(self):
        return self.y + self.h

    @property
    def cy(self):
        return self.y + self.h / 2


# ── Image preprocessing ────────────────────────────────────────────────

def load_binary_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Load image bytes and return a binary mask where strokes are 255
    and background is 0."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not decode image")

    blur = cv2.GaussianBlur(img, (3, 3), 0)
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Strokes are the minority of pixels in a text image. If 255 ended up
    # being the majority, invert.
    if np.count_nonzero(binary == 255) > np.count_nonzero(binary == 0):
        binary = cv2.bitwise_not(binary)

    return binary


def load_binary_from_pil(pil_image) -> np.ndarray:
    """Convert a PIL Image to binary mask."""
    gray = pil_image.convert('L')
    img = np.array(gray)
    blur = cv2.GaussianBlur(img, (3, 3), 0)
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if np.count_nonzero(binary == 255) > np.count_nonzero(binary == 0):
        binary = cv2.bitwise_not(binary)
    return binary


# ── Segmentation ────────────────────────────────────────────────────────

def find_char_boxes(binary: np.ndarray, min_area: int = 12) -> List[CharBox]:
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w * h >= min_area:
            boxes.append(CharBox(x, y, w, h))
    return boxes


def merge_fragments(boxes: List[CharBox]) -> List[CharBox]:
    """Merge separate components that belong to one character, e.g. the
    dot of 'i'/'j' sitting above its stem."""
    if not boxes:
        return boxes

    heights = sorted(b.h for b in boxes)
    median_h = heights[len(heights) // 2]

    small_idx = [i for i, b in enumerate(boxes) if b.h < 0.6 * median_h]
    large_idx = [i for i in range(len(boxes)) if i not in small_idx]

    merged: List[CharBox] = [boxes[i] for i in large_idx]
    used_small = set()

    for si in small_idx:
        s = boxes[si]
        s_cx = s.x + s.w / 2
        best_mi, best_gap = None, None

        for mi, m in enumerate(merged):
            x_aligned = (m.x - 0.3 * m.w) <= s_cx <= (m.x2 + 0.3 * m.w)
            if not x_aligned:
                continue
            gap = max(m.y - s.y2, s.y - m.y2, 0)
            if gap > 0.7 * median_h:
                continue
            if best_gap is None or gap < best_gap:
                best_mi, best_gap = mi, gap

        if best_mi is not None:
            m = merged[best_mi]
            nx, ny = min(m.x, s.x), min(m.y, s.y)
            nx2, ny2 = max(m.x2, s.x2), max(m.y2, s.y2)
            merged[best_mi] = CharBox(nx, ny, nx2 - nx, ny2 - ny)
            used_small.add(si)

    for si in small_idx:
        if si not in used_small:
            merged.append(boxes[si])

    return merged


def group_into_lines(boxes: List[CharBox], line_overlap_ratio: float = 0.5) -> List[List[CharBox]]:
    """Cluster character boxes into text lines, sort each line left-to-right."""
    if not boxes:
        return []

    boxes = sorted(boxes, key=lambda b: b.cy)
    lines: List[List[CharBox]] = []

    for b in boxes:
        placed = False
        for line in lines:
            ref = line[0]
            avg_h = (ref.h + b.h) / 2
            if abs(b.cy - sum(x.cy for x in line) / len(line)) < line_overlap_ratio * avg_h:
                line.append(b)
                placed = True
                break
        if not placed:
            lines.append([b])

    lines.sort(key=lambda line: sum(b.cy for b in line) / len(line))
    for line in lines:
        line.sort(key=lambda b: b.x)
    return lines


# ── Character cropping ──────────────────────────────────────────────────

def crop_and_prepare(binary: np.ndarray, box: CharBox, pad_ratio: float = 0.25) -> np.ndarray:
    """Crop a character, pad to square, resize to 28x28 (EMNIST style)."""
    pad = int(max(box.w, box.h) * pad_ratio)
    x0 = max(box.x - pad, 0)
    y0 = max(box.y - pad, 0)
    x1 = min(box.x2 + pad, binary.shape[1])
    y1 = min(box.y2 + pad, binary.shape[0])
    crop = binary[y0:y1, x0:x1]

    side = max(crop.shape)
    canvas = np.zeros((side, side), dtype=np.uint8)
    y_off = (side - crop.shape[0]) // 2
    x_off = (side - crop.shape[1]) // 2
    canvas[y_off:y_off + crop.shape[0], x_off:x_off + crop.shape[1]] = crop

    resized = cv2.resize(canvas, (28, 28), interpolation=cv2.INTER_AREA)
    return resized


def boxes_to_batch(binary: np.ndarray, boxes: List[CharBox],
                   mean: float, std: float) -> torch.Tensor:
    tiles = [crop_and_prepare(binary, b) for b in boxes]
    arr = np.stack(tiles).astype(np.float32) / 255.0
    arr = (arr - mean) / std
    return torch.from_numpy(arr).unsqueeze(1)  # (N, 1, 28, 28)


# ── Model loading (singleton) ──────────────────────────────────────────

_model_cache = {}


def get_model(checkpoint_path: str, device: str = 'cpu'):
    """Load model from checkpoint (cached)."""
    if checkpoint_path not in _model_cache:
        ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)
        mapping = ckpt.get('mapping', EMNIST_BALANCED_MAPPING)
        mean = ckpt.get('norm_mean', 0.1751)
        std = ckpt.get('norm_std', 0.3332)
        num_classes = ckpt.get('num_classes', len(mapping))

        model = EMNISTCNN(num_classes).to(device)
        model.load_state_dict(ckpt['model_state'])
        model.eval()

        _model_cache[checkpoint_path] = {
            'model': model,
            'mapping': mapping,
            'mean': mean,
            'std': std,
            'num_classes': num_classes,
            'val_acc': ckpt.get('val_acc', None),
            'epoch': ckpt.get('epoch', None),
        }
    return _model_cache[checkpoint_path]


# ── High-level recognition API ──────────────────────────────────────────

@torch.no_grad()
def recognize_single_character(binary: np.ndarray, checkpoint_path: str,
                                device: str = 'cpu') -> dict:
    """Recognize a single character from a binary image."""
    info = get_model(checkpoint_path, device)
    model, mapping = info['model'], info['mapping']
    mean, std = info['mean'], info['std']

    # Resize the whole image to 28x28
    resized = cv2.resize(binary, (28, 28), interpolation=cv2.INTER_AREA)
    arr = resized.astype(np.float32) / 255.0
    arr = (arr - mean) / std
    tensor = torch.from_numpy(arr).unsqueeze(0).unsqueeze(0).to(device)

    logits = model(tensor)
    probs = torch.softmax(logits, dim=1)
    conf, pred_idx = probs.max(dim=1)

    top_k = min(5, len(mapping))
    top_probs, top_indices = probs[0].topk(top_k)
    top_predictions = {
        mapping[idx.item()]: round(prob.item(), 4)
        for prob, idx in zip(top_probs, top_indices)
    }

    return {
        'predicted_character': mapping[pred_idx.item()],
        'confidence_score': round(conf.item(), 4),
        'top_predictions': top_predictions,
    }


@torch.no_grad()
def recognize_multi_character(binary: np.ndarray, checkpoint_path: str,
                               min_area: int = 12, device: str = 'cpu') -> dict:
    """Segment and recognize multiple characters from a binary image."""
    info = get_model(checkpoint_path, device)
    model, mapping = info['model'], info['mapping']
    mean, std = info['mean'], info['std']

    raw_boxes = find_char_boxes(binary, min_area=min_area)
    char_boxes = merge_fragments(raw_boxes)
    lines = group_into_lines(char_boxes)

    if not lines:
        # No characters found — fall back to single-char recognition
        return recognize_single_character(binary, checkpoint_path, device)

    result_lines = []
    all_chars = []

    for line in lines:
        batch = boxes_to_batch(binary, line, mean, std).to(device)
        logits = model(batch)
        probs = torch.softmax(logits, dim=1)
        confs, preds = probs.max(dim=1)

        chars = [mapping[p.item()] for p in preds]
        all_chars.extend(chars)

        # Build top-5 predictions for each character in this line
        per_char_top = []
        for i in range(len(line)):
            top_k = min(5, len(mapping))
            top_probs, top_indices = probs[i].topk(top_k)
            per_char_top.append({
                mapping[idx.item()]: round(prob.item(), 4)
                for prob, idx in zip(top_probs, top_indices)
            })

        result_lines.append({
            'text': ''.join(chars),
            'boxes': [(b.x, b.y, b.w, b.h) for b in line],
            'confidences': [round(c.item(), 4) for c in confs],
            'per_char_predictions': per_char_top,
        })

    full_text = '\n'.join(line['text'] for line in result_lines)

    # Overall confidence is the average per-character confidence
    all_confs = []
    for line in result_lines:
        all_confs.extend(line['confidences'])
    avg_confidence = sum(all_confs) / len(all_confs) if all_confs else 0.0

    # Build combined top_predictions from the first (or most confident) character
    # for backwards compatibility with the existing frontend
    best_line = result_lines[0] if result_lines else {}
    first_char_preds = best_line.get('per_char_predictions', [{}])
    top_predictions = first_char_preds[0] if first_char_preds else {}

    return {
        'predicted_character': full_text,
        'confidence_score': round(avg_confidence, 4),
        'top_predictions': top_predictions,
        'lines': result_lines,
        'num_characters': len(all_chars),
    }
