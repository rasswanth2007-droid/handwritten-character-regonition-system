from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """Allow login with email instead of username."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        # Try email lookup first
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            # Fall back to normal username lookup
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
