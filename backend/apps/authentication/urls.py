from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    VerifyOTPView,
    ProfileView,
    user_list,
    delete_user
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('users/', user_list, name='user_list'),
    path('users/<uuid:user_id>/delete/', delete_user, name='delete_user'),
]
