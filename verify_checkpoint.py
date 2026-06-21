"""Quick script to verify the trained EMNIST checkpoint."""
import torch
import sys
sys.path.insert(0, r"d:\projects\d&a rec sys")

ckpt = torch.load(r"d:\projects\d&a rec sys\checkpoint.pt", map_location="cpu")
print(f"Epoch:         {ckpt['epoch']}")
print(f"Val Accuracy:  {ckpt['val_acc']:.4f}  ({ckpt['val_acc']*100:.2f}%)")
print(f"Num Classes:   {ckpt['num_classes']}")
print(f"Norm Mean:     {ckpt['norm_mean']}")
print(f"Norm Std:      {ckpt['norm_std']}")
print(f"Mapping:       {ckpt['mapping']}")
