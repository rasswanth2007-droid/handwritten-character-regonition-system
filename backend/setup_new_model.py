"""
Quick setup script: copies the trained EMNIST Balanced checkpoint into the
expected location for the HDC backend, then runs the Django migration for
the updated Prediction model.

Usage:
    python setup_new_model.py
"""
import shutil
import os
import subprocess
import sys

CHECKPOINT_SRC = r"d:\projects\d&a rec sys\checkpoint.pt"
CHECKPOINT_DST = os.path.join(os.path.dirname(__file__), "ml", "checkpoints", "emnist_balanced.pt")


def main():
    # 1. Copy checkpoint
    os.makedirs(os.path.dirname(CHECKPOINT_DST), exist_ok=True)
    if os.path.exists(CHECKPOINT_SRC):
        shutil.copy2(CHECKPOINT_SRC, CHECKPOINT_DST)
        print(f"✓ Copied checkpoint: {CHECKPOINT_SRC} → {CHECKPOINT_DST}")
    else:
        print(f"✗ Source checkpoint not found: {CHECKPOINT_SRC}")
        print("  Please run train.py in d:\\projects\\d&a rec sys first.")
        sys.exit(1)

    # 2. Verify checkpoint
    try:
        import torch
        ckpt = torch.load(CHECKPOINT_DST, map_location="cpu", weights_only=False)
        print(f"✓ Checkpoint verified:")
        print(f"    Epoch:       {ckpt.get('epoch', '?')}")
        print(f"    Val Accuracy: {ckpt.get('val_acc', '?'):.4f}" if isinstance(ckpt.get('val_acc'), float) else f"    Val Accuracy: {ckpt.get('val_acc', '?')}")
        print(f"    Classes:     {ckpt.get('num_classes', '?')}")
    except Exception as e:
        print(f"✗ Could not verify checkpoint: {e}")
        sys.exit(1)

    # 3. Run Django migration
    print("\n→ Running Django migrations for updated Prediction model...")
    try:
        subprocess.run(
            [sys.executable, "manage.py", "makemigrations", "core"],
            cwd=os.path.dirname(__file__),
            check=True,
        )
        subprocess.run(
            [sys.executable, "manage.py", "migrate"],
            cwd=os.path.dirname(__file__),
            check=True,
        )
        print("✓ Migrations applied successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Migration failed: {e}")
        print("  You can run manually: python manage.py makemigrations core && python manage.py migrate")

    print("\n✓ Setup complete! You can now start the server with: python manage.py runserver")


if __name__ == "__main__":
    main()
