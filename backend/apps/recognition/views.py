from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from .serializers import PredictionSerializer, PredictionCreateSerializer
from .services import ImagePreprocessor, CharacterRecognizer, GeminiVisionEngine
from apps.core.models import Prediction, MLModel
import os


# Singleton Gemini engine — initialized once when Django starts
_gemini_engine = None

def get_gemini_engine():
    global _gemini_engine
    if _gemini_engine is None:
        _gemini_engine = GeminiVisionEngine()
    return _gemini_engine


class PredictionView(generics.CreateAPIView):
    serializer_class = PredictionCreateSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        image_file = serializer.validated_data['image']
        input_method = serializer.validated_data.get('input_method', 'upload')
        
        # Determine checkpoint path
        # Priority: deployed model in DB -> default EMNIST checkpoint
        checkpoint_path = None
        active_model = MLModel.objects.filter(is_active=True, is_deployed=True).first()
        if active_model and active_model.file_path and os.path.exists(active_model.file_path):
            checkpoint_path = active_model.file_path
        
        # ── Engine 1: PyTorch CNN ──────────────────────────────────────
        preprocessor = ImagePreprocessor()
        binary_image, pil_image = preprocessor.preprocess_image(image_file)
        
        recognizer = CharacterRecognizer(model_path=checkpoint_path)
        prediction_result = recognizer.predict(binary_image)
        
        # ── Engine 2: Gemini Vision (confidence-gated) ─────────────────
        engine = get_gemini_engine()
        prediction_result = engine.ensemble(prediction_result, pil_image)
        
        # Save prediction to database
        prediction = Prediction.objects.create(
            user=request.user,
            image=image_file,
            predicted_character=prediction_result['predicted_character'],
            confidence_score=prediction_result['confidence_score'],
            top_predictions=prediction_result['top_predictions'],
            input_method=input_method
        )
        
        # Build response — include all details for the frontend
        response_data = PredictionSerializer(prediction).data
        
        # Add ensemble metadata so frontend can show "AI Corrected" badge
        response_data['correction_source'] = prediction_result.get('correction_source', 'pytorch')
        response_data['raw_pytorch_prediction'] = prediction_result.get('raw_pytorch_prediction', '')
        
        if 'lines' in prediction_result:
            response_data['lines'] = prediction_result['lines']
            response_data['num_characters'] = prediction_result.get('num_characters', 1)
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class PredictionListView(generics.ListAPIView):
    serializer_class = PredictionSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Prediction.objects.all()
        return Prediction.objects.filter(user=user)


class PredictionDetailView(generics.RetrieveAPIView):
    serializer_class = PredictionSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Prediction.objects.all()
        return Prediction.objects.filter(user=user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_predict(request):
    """Handle batch prediction for multiple images"""
    if 'images' not in request.FILES:
        return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    images = request.FILES.getlist('images')
    results = []
    
    preprocessor = ImagePreprocessor()
    recognizer = CharacterRecognizer()
    engine = get_gemini_engine()
    
    for image_file in images:
        try:
            # Engine 1: PyTorch
            binary_image, pil_image = preprocessor.preprocess_image(image_file)
            prediction_result = recognizer.predict(binary_image)
            
            # Engine 2: Gemini (confidence-gated)
            prediction_result = engine.ensemble(prediction_result, pil_image)
            
            # Save prediction
            prediction = Prediction.objects.create(
                user=request.user,
                image=image_file,
                predicted_character=prediction_result['predicted_character'],
                confidence_score=prediction_result['confidence_score'],
                top_predictions=prediction_result['top_predictions'],
                input_method='upload'
            )
            
            results.append({
                'id': str(prediction.id),
                'predicted_character': prediction_result['predicted_character'],
                'confidence_score': prediction_result['confidence_score'],
                'top_predictions': prediction_result['top_predictions'],
                'correction_source': prediction_result.get('correction_source', 'pytorch'),
                'raw_pytorch_prediction': prediction_result.get('raw_pytorch_prediction', ''),
            })
        except Exception as e:
            results.append({'error': str(e)})
    
    return Response({'results': results})
