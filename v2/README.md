# Retrain — EMNIST Model v2

This folder contains the Google Colab notebook for retraining the HCR character recognition model.

## What's improved (v2 vs v1)

| Aspect | v1 (Current) | v2 (This Notebook) |
|---|---|---|
| **Dataset** | EMNIST Balanced — 131,600 samples | EMNIST ByMerge — **814,255 samples** (6× more!) |
| **Architecture** | Plain CNN (32→64→128, ~200K params) | Residual CNN + SE blocks (64→128→256, ~1.2M params) |
| **Augmentation** | RandomAffine only | RandomAffine + **Cutout** + **Mixup** + Perspective |
| **Scheduler** | CosineAnnealing | **OneCycleLR** (faster convergence) |
| **Regularization** | Dropout only | Dropout + **Label Smoothing** (0.1) |
| **Class Imbalance** | None (Balanced has equal samples) | **WeightedRandomSampler** |
| **Epochs** | 20 | 50 (with early stopping) |

## Why EMNIST ByMerge instead of Balanced?

Both have the **exact same 47 classes** (10 digits + 26 uppercase + 11 distinct lowercase).

- **Balanced**: Artificially capped at 2,800 samples per class = 131,600 total
- **ByMerge**: Full dataset = **814,255 samples** (real-world distribution)

More training data = better generalization. The class imbalance is handled by weighted sampling.

## How to use

1. Open `retrain_emnist_v2.ipynb` in Google Colab
2. Set Runtime → **GPU** (T4 or better)
3. Run all cells (takes ~30-45 min on T4)
4. Download the output files:
   - `checkpoints/emnist_balanced.pt` — trained weights
   - `checkpoints/emnist_model.py` — updated model architecture

## How to deploy

After training:
1. Replace `backend/ml/emnist_model.py` with the downloaded `emnist_model.py`
2. Copy `emnist_balanced.pt` into `backend/ml/checkpoints/`
3. Push to GitHub → HuggingFace Space auto-rebuilds
