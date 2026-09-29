from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.core.cache import cache
import random
import requests
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    RegisterSerializer,
    LoginSerializer
)

User = get_user_model()

def verify_recaptcha(token):
    if not settings.RECAPTCHA_SECRET_KEY:
        return True # Skip if not configured
    if not token:
        return False
    data = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': token
    }
    r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
    result = r.json()
    # Require success and a decent score for v3
    if result.get('success') and result.get('score', 0) >= 0.5:
        return True
    return False

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        recaptcha_token = request.data.get('recaptcha_token')
        if not verify_recaptcha(recaptcha_token):
            return Response({'detail': 'Bot detected. reCAPTCHA verification failed.'}, status=status.HTTP_403_FORBIDDEN)
        return super().post(request, *args, **kwargs)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        recaptcha_token = request.data.get('recaptcha_token')
        if not verify_recaptcha(recaptcha_token):
            return Response({'error': 'Bot detected. reCAPTCHA verification failed.'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully. You can now log in.',
            'require_otp': False,
            'email': user.email
        }, status=status.HTTP_201_CREATED)




class ProfileView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_object(self):
        return self.request.user


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    if request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    if request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        if user == request.user:
            return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response({'message': 'User deleted successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
