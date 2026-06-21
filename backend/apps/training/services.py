"""
Training service — trains the EMNIST Balanced CNN model using PyTorch.

Replaces the old TensorFlow training which used a broken MNIST+EMNIST merge.
Now uses the EMNIST Balanced dataset (47 classes) via torchvision.
"""
import os
import time
import json
import io
import base64

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from torchvision.transforms import functional as TF

from django.conf import settings

from ml.emnist_model import EMNISTCNN, EMNIST_BALANCED_MAPPING, NUM_CLASSES


# Mean/std for EMNIST Balanced normalization
EMNIST_MEAN, EMNIST_STD = 0.1751, 0.3332


def fix_emnist_orientation(img):
    """Fix the known EMNIST orientation quirk (transposed/rotated)."""
    img = TF.rotate(img, -90)
    img = TF.hflip(img)
    return img


class ModelTrainer:
    """PyTorch-based EMNIST Balanced model trainer."""

    def __init__(self, model_type='combined'):
        self.model_type = model_type
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # All model types now use EMNIST Balanced (47 classes)
        self.classes = EMNIST_BALANCED_MAPPING
        self.num_classes = NUM_CLASSES

    def _build_transforms(self, train: bool):
        ops = [transforms.Lambda(fix_emnist_orientation)]
        if train:
            ops.append(transforms.RandomAffine(
                degrees=8, translate=(0.08, 0.08), scale=(0.9, 1.1)
            ))
        ops.extend([
            transforms.ToTensor(),
            transforms.Normalize((EMNIST_MEAN,), (EMNIST_STD,)),
        ])
        return transforms.Compose(ops)

    def _get_dataloaders(self, data_dir, batch_size=256, val_fraction=0.1):
        train_full = datasets.EMNIST(
            root=data_dir, split='balanced', train=True, download=True,
            transform=self._build_transforms(train=True),
        )
        test_set = datasets.EMNIST(
            root=data_dir, split='balanced', train=False, download=True,
            transform=self._build_transforms(train=False),
        )

        n_val = int(len(train_full) * val_fraction)
        n_train = len(train_full) - n_val
        train_set, val_set = random_split(
            train_full, [n_train, n_val],
            generator=torch.Generator().manual_seed(42),
        )
        val_set.dataset = datasets.EMNIST(
            root=data_dir, split='balanced', train=True, download=False,
            transform=self._build_transforms(train=False),
        )

        train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True,
                                   num_workers=2, pin_memory=torch.cuda.is_available())
        val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False,
                                 num_workers=2, pin_memory=torch.cuda.is_available())
        test_loader = DataLoader(test_set, batch_size=batch_size, shuffle=False,
                                  num_workers=2, pin_memory=torch.cuda.is_available())
        return train_loader, val_loader, test_loader

    def _run_epoch(self, model, loader, optimizer=None, criterion=None):
        is_train = optimizer is not None
        model.train(is_train)
        total_loss, total_correct, total_n = 0.0, 0, 0

        with torch.set_grad_enabled(is_train):
            for images, labels in loader:
                images, labels = images.to(self.device), labels.to(self.device)
                logits = model(images)
                loss = criterion(logits, labels)

                if is_train:
                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()

                total_loss += loss.item() * images.size(0)
                total_correct += (logits.argmax(1) == labels).sum().item()
                total_n += images.size(0)

        return total_loss / total_n, total_correct / total_n

    def train_model(self, epochs=20, batch_size=256, validation_split=0.1):
        """Train the EMNIST Balanced CNN model."""
        data_dir = os.path.join(settings.BASE_DIR, 'ml', 'data')
        os.makedirs(data_dir, exist_ok=True)

        train_loader, val_loader, test_loader = self._get_dataloaders(
            data_dir, batch_size
        )

        self.model = EMNISTCNN(NUM_CLASSES).to(self.device)
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(
            self.model.parameters(), lr=1e-3, weight_decay=1e-4
        )
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=epochs
        )

        best_val_acc = 0.0
        training_history = {
            'epochs': epochs,
            'training_loss': [],
            'training_accuracy': [],
            'validation_loss': [],
            'validation_accuracy': [],
        }

        for epoch in range(1, epochs + 1):
            train_loss, train_acc = self._run_epoch(
                self.model, train_loader, optimizer, criterion
            )
            val_loss, val_acc = self._run_epoch(
                self.model, val_loader, criterion=criterion
            )
            scheduler.step()

            training_history['training_loss'].append(train_loss)
            training_history['training_accuracy'].append(train_acc)
            training_history['validation_loss'].append(val_loss)
            training_history['validation_accuracy'].append(val_acc)

            if val_acc > best_val_acc:
                best_val_acc = val_acc

        # Final test evaluation
        test_loss, test_acc = self._run_epoch(
            self.model, test_loader, criterion=criterion
        )

        metrics = {
            'accuracy': test_acc,
            'precision': test_acc,  # Approximate for now
            'recall': test_acc,
            'f1_score': test_acc,
            'training_loss': training_history['training_loss'][-1],
            'validation_loss': training_history['validation_loss'][-1],
        }

        return self.model, metrics, training_history

    def save_model(self, model_path):
        """Save the trained model as a PyTorch checkpoint."""
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        torch.save({
            'model_state': self.model.state_dict(),
            'num_classes': NUM_CLASSES,
            'mapping': EMNIST_BALANCED_MAPPING,
            'norm_mean': EMNIST_MEAN,
            'norm_std': EMNIST_STD,
        }, model_path)
        return model_path

    def generate_confusion_matrix(self, y_true, y_pred):
        """Generate confusion matrix as base64 image (placeholder)."""
        # This would need matplotlib — keeping interface compatible
        return ""
