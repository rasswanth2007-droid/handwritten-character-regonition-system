"""
EMNIST CNN v2 — Residual CNN with Squeeze-and-Excitation blocks.

Drop-in replacement for the original emnist_model.py in backend/ml/.
Input:  (N, 1, 28, 28) grayscale images, normalized.
Output: (N, 47) logits, indexed per EMNIST_BALANCED_MAPPING.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


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


class SEBlock(nn.Module):
    """Channel attention: learns which feature channels are important."""
    def __init__(self, channels, reduction=4):
        super().__init__()
        self.squeeze = nn.AdaptiveAvgPool2d(1)
        self.excitation = nn.Sequential(
            nn.Linear(channels, channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels, bias=False),
            nn.Sigmoid(),
        )

    def forward(self, x):
        b, c, _, _ = x.shape
        scale = self.squeeze(x).view(b, c)
        scale = self.excitation(scale).view(b, c, 1, 1)
        return x * scale


class ResidualBlock(nn.Module):
    def __init__(self, in_ch, out_ch, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_ch)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_ch)
        self.se = SEBlock(out_ch)

        self.shortcut = nn.Sequential()
        if stride != 1 or in_ch != out_ch:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 1, stride=stride, bias=False),
                nn.BatchNorm2d(out_ch),
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)), inplace=True)
        out = self.bn2(self.conv2(out))
        out = self.se(out)
        out += self.shortcut(x)
        return F.relu(out, inplace=True)


class EMNISTCNN(nn.Module):
    """Residual CNN with SE blocks for EMNIST character recognition.
    
    Drop-in compatible: same class name (EMNISTCNN) as v1, same
    checkpoint format, same input/output shapes.
    """
    def __init__(self, num_classes: int = NUM_CLASSES):
        super().__init__()
        self.stem = nn.Sequential(
            nn.Conv2d(1, 64, 3, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
        )
        self.stage1 = nn.Sequential(
            ResidualBlock(64, 64),
            ResidualBlock(64, 64),
        )
        self.stage2 = nn.Sequential(
            ResidualBlock(64, 128, stride=2),
            ResidualBlock(128, 128),
        )
        self.stage3 = nn.Sequential(
            ResidualBlock(128, 256, stride=2),
            ResidualBlock(256, 256),
        )
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    # Keep old attribute names for backward compat with recognition_engine
    @property
    def features(self):
        return nn.Sequential(self.stem, self.stage1, self.stage2, self.stage3)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.pool(x).flatten(1)
        return self.classifier(x)
