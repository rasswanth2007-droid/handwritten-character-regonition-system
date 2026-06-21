# 🔍 Diagnosis: Why Your Recognition System Is Failing

## TL;DR

Your **combined model accuracy is only 49.78%** — that's barely better than random guessing for 36 classes. The digits-only model is great (99.3%) but can't recognize letters. Here's why, and exactly how to fix it.

---

## 📊 Current Accuracy Numbers

| Model | Test Accuracy | F1 Score | Verdict |
|---|---|---|---|
| `digits_model` (MNIST only) | **99.32%** | 99.32% | ✅ Excellent — but digits only |
| `combined_model` (run 1) | **83.50%** | 82.92% | ⚠️ Mediocre |
| `combined_model` (run 2) | **49.78%** | 36.81% | ❌ **Catastrophically bad** |

> [!CAUTION]
> The **49.78% combined model** is likely the one being loaded by the backend (it's the newest and appears first in the `possible_paths` list in [views.py](file:///d:/projects/hdc/backend/apps/recognition/views.py#L33-L38)). This model is essentially coin-flipping on 36 classes.

### Training curve of the 49.78% model:

The training history shows the model plateaued at ~50% validation accuracy and could not improve — a classic sign of a fundamentally broken training setup, not just "needs more epochs."

---

## 🐛 Root Causes (3 Critical Issues)

### Issue 1: Broken Dataset Merging (The Main Killer)

In [train_model.py](file:///d:/projects/hdc/backend/ml/train_model.py#L117-L143), the `load_combined()` method:

```python
# Loads MNIST digits (labels 0-9)
# Loads EMNIST letters (labels 0-25, then shifted to 10-35)
# Concatenates them together
```

**The problem:** EMNIST `letters` split and MNIST have **completely different preprocessing, centering, and writer pools**. Naively concatenating them with different label ranges creates a severely imbalanced, misaligned dataset where:
- The digit images (from MNIST) look visually different from the letter images (from EMNIST letters)
- The model can't learn a consistent feature representation across both
- The class distribution is heavily skewed (60,000 MNIST digits vs. 124,800 EMNIST letters spread across 26 classes)

> [!IMPORTANT]
> This is why your **digits-only model works perfectly (99.3%)** but the **combined model fails (49.78%)**. The datasets were never designed to be concatenated this way.

### Issue 2: No Sequence/Multi-Character Recognition

The current system processes **one image = one character prediction**. There is no:
- Character segmentation (splitting an image of "HELLO" into H, E, L, L, O)
- Line detection or reading-order sorting
- Multi-character output

When users draw multiple characters on the canvas, the entire drawing is resized to 28×28 and classified as a single character — which obviously produces garbage results.

### Issue 3: Preprocessing Pipeline Mismatch

In [services.py](file:///d:/projects/hdc/backend/apps/recognition/services.py#L13-L60), the `preprocess_image` method:
- Uses hard-coded threshold `127` instead of adaptive/Otsu thresholding
- Does not apply the same normalization the EMNIST model expects
- Does not center the character in the 28×28 frame the way EMNIST/MNIST data is centered
- No padding-to-square step — characters get distorted by aspect-ratio changes

---

## ✅ The Fix: Integrate the Better System You Already Have

You already have a much better system in `d:\projects\d&a rec sys\` that solves all three problems:

| Feature | HDC (Current, Broken) | d&a rec sys (Already Built) |
|---|---|---|
| Dataset | MNIST + EMNIST letters (broken merge) | **EMNIST Balanced** (single, curated 47-class dataset) |
| Expected accuracy | ~88-90% on EMNIST Balanced | ❌ 49.78% on frankenstein dataset |
| Multi-char recognition | ❌ None | ✅ Full segmentation pipeline |
| Sequence reading | ❌ Single character only | ✅ Line detection + left-to-right ordering |
| Character preprocessing | ❌ Naive resize | ✅ Proper crop → pad-to-square → resize |
| Framework | TensorFlow/Keras | PyTorch |

### Remediation Plan

#### Step 1: Complete the EMNIST Balanced Training (Already Running!)

Your `train.py` in `d&a rec sys` is already running. Once it finishes, you should get **~88-90% accuracy** on 47 classes. This single model handles digits, uppercase, AND distinguishable lowercase.

#### Step 2: Integrate the PyTorch Model into the HDC Backend

Replace the TensorFlow recognition service with the PyTorch model + segmentation pipeline:

1. Copy `model.py`, `mapping.py`, and `segment_and_recognize.py` from `d&a rec sys` into the HDC backend
2. Replace `services.py` to use the PyTorch model + segmentation pipeline
3. Update `requirements.txt` to swap TensorFlow for PyTorch + OpenCV

#### Step 3: Fix the Frontend Canvas

The canvas currently sends the entire drawing as one image. We need to keep that (the segmentation pipeline handles splitting), but the preprocessing needs to match.

---

## 🚀 Shall I Proceed?

I can implement all of these fixes right now. Specifically:

1. **Wait for the EMNIST training to complete** and check the actual accuracy
2. **Rewrite the HDC backend recognition service** to use the PyTorch EMNIST model + segmentation pipeline
3. **Add a multi-character endpoint** so the frontend gets back a full text string, not just one character
4. **Fix the preprocessing pipeline** to properly handle canvas-drawn input

> [!NOTE]
> The rewrite changes the ML backend from TensorFlow to PyTorch. The frontend and Django REST API stay the same — only the recognition service internals change. No frontend changes needed.

**Please confirm you'd like me to proceed with the fix, or let me know if you have questions about any of the issues above.**
