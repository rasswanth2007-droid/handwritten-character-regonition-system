"""
Single unified CNN for EMNIST Balanced (47-class) character recognition.

Input:  (N, 1, 28, 28) grayscale images, normalized.
Output: (N, 47) logits, indexed per EMNIST_BALANCED_MAPPING.

This same model/checkpoint is used for:
  - per-character classification inside multi-character recognition
  - single character prediction from canvas/upload
"""
import torch
import torch.nn as nn


# ── EMNIST Balanced label mapping (47 classes) ──────────────────────────
EMNIST_BALANCED_MAPPING = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'd', 'e', 'f', 'g', 'h', 'n', 'q', 'r', 't',
]

NUM_CLASSES = len(EMNIST_BALANCED_MAPPING)  # 47

# Convenience subsets
DIGIT_INDICES = list(range(0, 10))
UPPERCASE_INDICES = list(range(10, 36))
LOWERCASE_INDICES = list(range(36, 47))


def index_to_char(idx: int) -> str:
    return EMNIST_BALANCED_MAPPING[idx]


class EMNISTCNN(nn.Module):
    def __init__(self, num_classes: int = NUM_CLASSES):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),           # 28 -> 14
            nn.Dropout(0.25),

            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),           # 14 -> 7
            nn.Dropout(0.25),

            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),           # 7 -> 3
            nn.Dropout(0.25),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 3 * 3, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        return self.classifier(x)
