import torch
import numpy as np
import cv2
import sys
import os

# add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from ml.recognition_engine import get_model

device = 'cpu'
info = get_model('backend/ml/checkpoints/emnist_balanced.pt', device)
model, mapping = info['model'], info['mapping']
mean, std = info['mean'], info['std']

# Create a solid white square (255)
solid_white = np.ones((28, 28), dtype=np.float32)

arr = (solid_white - mean) / std
tensor = torch.from_numpy(arr).unsqueeze(0).unsqueeze(0).to(device)

logits = model(tensor)
probs = torch.softmax(logits, dim=1)
conf, pred_idx = probs.max(dim=1)

print(f"Prediction for solid white square: {mapping[pred_idx.item()]} (conf {conf.item():.4f})")
