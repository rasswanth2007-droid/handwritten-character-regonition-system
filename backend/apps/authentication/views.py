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
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        cache.set(f"otp_{user.email}", otp, timeout=600)  # Valid for 10 minutes
        
        # Send Email in background to prevent hanging the server!
        import threading
        def send_otp_email(email, code):
            try:
                send_mail(
                    subject='Verify your HDC Account',
                    message=f'Your verification code is: {code}\n\nThis code will expire in 10 minutes.',
                    from_email=None,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Email failed to send: {e}")
                
        threading.Thread(target=send_otp_email, args=(user.email, otp)).start()

        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully. Please verify your email.',
            'require_otp': True,
            'email': user.email
        }, status=status.HTTP_201_CREATED)

class VerifyOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        cached_otp = cache.get(f"otp_{email}")
        
        if not cached_otp or cached_otp != str(otp):
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            user.is_active = True
            user.save()
            cache.delete(f"otp_{email}")
            return Response({'message': 'Email verified successfully! You can now log in.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


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
