"""
Management script to seed the admin user and clean up researcher role.
Run with: python seed_admin.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# -- 1. Create admin user --
ADMIN_EMAIL = 'duplicate152007@gmail.com'
ADMIN_PASSWORD = 'rass152007'
ADMIN_USERNAME = 'admin'

admin_user, created = User.objects.get_or_create(
    email=ADMIN_EMAIL,
    defaults={
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
        'first_name': 'Admin',
        'last_name': 'User',
    }
)

if created:
    admin_user.set_password(ADMIN_PASSWORD)
    admin_user.save()
    print(f"[OK] Admin user created: {ADMIN_EMAIL}")
else:
    # Update existing user to admin
    admin_user.role = 'admin'
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.is_active = True
    admin_user.set_password(ADMIN_PASSWORD)
    admin_user.save()
    print(f"[OK] Admin user updated: {ADMIN_EMAIL}")

# -- 2. Clean up researcher role --
researchers = User.objects.filter(role='researcher')
researcher_count = researchers.count()

if researcher_count > 0:
    from apps.core.models import Prediction, Dataset, MLModel
    for r in researchers:
        pred_count = Prediction.objects.filter(user=r).count()
        dataset_count = Dataset.objects.filter(uploaded_by=r).count()
        model_count = MLModel.objects.filter(trained_by=r).count()

        if pred_count + dataset_count + model_count == 0:
            print(f"[DEL] Deleting researcher '{r.email}' (no data)")
            r.delete()
        else:
            r.role = 'user'
            r.save()
            print(f"[DOWN] Downgraded researcher '{r.email}' to user (has {pred_count} predictions)")
else:
    print("[OK] No researcher users to clean up")

# -- 3. Summary --
print(f"\n--- Current users ---")
for u in User.objects.all().order_by('role', 'email'):
    print(f"   {u.role:6s} | {u.email}")

print(f"\n[DONE] Admin can now login with:")
print(f"   Email:    {ADMIN_EMAIL}")
print(f"   Password: {ADMIN_PASSWORD}")
