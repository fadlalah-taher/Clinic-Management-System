from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """Public endpoint – registers a new user (doctor or patient)."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """Returns the currently authenticated user's profile, including role and linked entity."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = UserSerializer(request.user).data
        try:
            profile = request.user.profile
            data['role'] = profile.role
            if profile.role == 'doctor' and profile.doctor:
                data['doctor_id'] = profile.doctor.id
                data['doctor_name'] = profile.doctor.name
                data['doctor_specialty'] = profile.doctor.specialty
            else:
                data['patient_mongo_id'] = profile.patient_mongo_id
        except Exception:
            # Admin or user without a profile
            data['role'] = 'doctor'
            data['doctor_id'] = None
        return Response(data)
