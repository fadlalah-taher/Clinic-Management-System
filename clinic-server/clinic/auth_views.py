import os
from bson import ObjectId

from rest_framework import generics, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """Public endpoint – registers a new user (doctor or patient)."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


def _build_profile_response(request):
    """Build a full profile dict for the authenticated user (role-aware)."""
    user = request.user
    data = UserSerializer(user).data
    try:
        profile = user.profile
        data['role'] = profile.role

        if profile.role == 'doctor' and profile.doctor:
            doctor = profile.doctor
            data['doctor_id'] = doctor.id
            data['doctor_name'] = doctor.name
            data['doctor_specialty'] = doctor.specialty
            data['doctor_phone'] = doctor.phone
            data['doctor_email'] = doctor.email
            if doctor.profile_image:
                data['profile_image_url'] = request.build_absolute_uri(doctor.profile_image.url)
            if doctor.cv_document:
                data['cv_document_url'] = request.build_absolute_uri(doctor.cv_document.url)

        elif profile.role == 'patient' and profile.patient_mongo_id:
            from .mongodb import patients_collection
            data['patient_mongo_id'] = profile.patient_mongo_id
            try:
                patient = patients_collection.find_one({'_id': ObjectId(profile.patient_mongo_id)})
                if patient:
                    data['patient_name'] = patient.get('name', '')
                    data['patient_phone'] = patient.get('phone', '')
                    data['patient_address'] = patient.get('address', '')
                    data['patient_dob'] = patient.get('date_of_birth', '')
                    if patient.get('profile_image'):
                        data['profile_image_url'] = request.build_absolute_uri(
                            f"/media/{patient['profile_image']}"
                        )
                    if patient.get('health_book'):
                        data['health_book_url'] = request.build_absolute_uri(
                            f"/media/{patient['health_book']}"
                        )
            except Exception:
                pass
    except AttributeError:
        # Admin or user without a profile
        data['role'] = 'admin'
        data['doctor_id'] = None
    return data


class MeView(APIView):
    """Returns the currently authenticated user's basic profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(_build_profile_response(request))


class ProfileView(APIView):
    """
    GET  /api/auth/profile/  – Full profile (including file URLs).
    PATCH /api/auth/profile/ – Update profile + file uploads (multipart/form-data).
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get(self, request):
        return Response(_build_profile_response(request))

    def patch(self, request):
        user = request.user

        # Update Django User fields
        changed = False
        for field in ['first_name', 'last_name', 'email']:
            val = request.data.get(field, '').strip()
            if val:
                setattr(user, field, val)
                changed = True
        if changed:
            user.save()

        try:
            profile = user.profile
        except AttributeError:
            return Response(_build_profile_response(request))

        if profile.role == 'doctor' and profile.doctor:
            doctor = profile.doctor
            for field in ['name', 'specialty', 'phone']:
                val = request.data.get(field, '').strip()
                if val:
                    setattr(doctor, field, val)
            if 'profile_image' in request.FILES:
                doctor.profile_image = request.FILES['profile_image']
            if 'cv_document' in request.FILES:
                doctor.cv_document = request.FILES['cv_document']
            doctor.save()

        elif profile.role == 'patient' and profile.patient_mongo_id:
            from .mongodb import patients_collection
            patient_id = profile.patient_mongo_id
            update_data = {}

            for field in ['name', 'phone', 'address', 'date_of_birth']:
                val = request.data.get(field, '').strip()
                if val:
                    update_data[field] = val

            if 'profile_image' in request.FILES:
                img_file = request.FILES['profile_image']
                img_dir = os.path.join(settings.MEDIA_ROOT, 'patients', 'images')
                os.makedirs(img_dir, exist_ok=True)
                ext = os.path.splitext(img_file.name)[1].lower()
                filename = f"{patient_id}{ext}"
                with open(os.path.join(img_dir, filename), 'wb+') as dest:
                    for chunk in img_file.chunks():
                        dest.write(chunk)
                update_data['profile_image'] = f"patients/images/{filename}"

            if 'health_book' in request.FILES:
                pdf_file = request.FILES['health_book']
                pdf_dir = os.path.join(settings.MEDIA_ROOT, 'patients', 'health_books')
                os.makedirs(pdf_dir, exist_ok=True)
                ext = os.path.splitext(pdf_file.name)[1].lower()
                filename = f"{patient_id}{ext}"
                with open(os.path.join(pdf_dir, filename), 'wb+') as dest:
                    for chunk in pdf_file.chunks():
                        dest.write(chunk)
                update_data['health_book'] = f"patients/health_books/{filename}"

            if update_data:
                patients_collection.update_one(
                    {'_id': ObjectId(patient_id)},
                    {'$set': update_data}
                )

        return Response(_build_profile_response(request))
