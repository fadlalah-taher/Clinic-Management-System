from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Doctor, Medication, UserProfile


# ── Auth ───────────────────────────────────────────────────
class RegisterSerializer(serializers.Serializer):
    """
    Accepts role=doctor|patient plus role-specific extra fields.
    Creates User + UserProfile + linked Doctor (SQL) or Patient (MongoDB).
    """
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirm password')
    role = serializers.ChoiceField(choices=['doctor', 'patient'])

    # Doctor-specific
    specialty = serializers.CharField(required=False, default='general', allow_blank=True)
    phone = serializers.CharField(required=False, default='', allow_blank=True)

    # Patient-specific
    date_of_birth = serializers.DateField(required=False, allow_null=True, default=None)

    def to_internal_value(self, data):
        # Coerce empty string date_of_birth to None before field-level validation
        if data.get('date_of_birth') == '':
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            data['date_of_birth'] = None
        return super().to_internal_value(data)
    address = serializers.CharField(required=False, default='', allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if data.get('role') == 'doctor' and not data.get('specialty'):
            raise serializers.ValidationError({'specialty': 'Specialty is required for doctors.'})
        if data.get('role') == 'patient' and not data.get('date_of_birth'):
            raise serializers.ValidationError({'date_of_birth': 'Date of birth is required for patients.'})
        return data

    def create(self, validated_data):
        role = validated_data['role']
        specialty = validated_data.get('specialty', 'general')
        phone = validated_data.get('phone', '')
        date_of_birth = validated_data.get('date_of_birth')
        address = validated_data.get('address', '')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        full_name = f"{first_name} {last_name}".strip() or validated_data['username']

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=first_name,
            last_name=last_name,
            password=validated_data['password']
        )

        if role == 'doctor':
            # Ensure doctor email is unique in the Doctor table
            if Doctor.objects.filter(email=validated_data['email']).exists():
                doctor = Doctor.objects.get(email=validated_data['email'])
            else:
                doctor = Doctor.objects.create(
                    name=full_name,
                    specialty=specialty or 'general',
                    email=validated_data['email'],
                    phone=phone,
                    date_of_birth=date_of_birth,
                )
            UserProfile.objects.create(user=user, role='doctor', doctor=doctor)
        else:
            from .mongodb import patients_collection
            from datetime import datetime
            # Check if patient email already exists in MongoDB
            existing = patients_collection.find_one({'email': validated_data['email']})
            if existing:
                patient_mongo_id = str(existing['_id'])
            else:
                result = patients_collection.insert_one({
                    'name': full_name,
                    'email': validated_data['email'],
                    'phone': phone,
                    'address': address,
                    'date_of_birth': str(date_of_birth) if date_of_birth else '',
                    'created_at': datetime.utcnow().isoformat(),
                })
                patient_mongo_id = str(result.inserted_id)
            UserProfile.objects.create(user=user, role='patient', patient_mongo_id=patient_mongo_id)

        return user

    def to_representation(self, instance):
        return {'detail': 'Registration successful.', 'username': instance.username}


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


# ── Doctor ─────────────────────────────────────────────────
class DoctorSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()
    cv_document_url = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = '__all__'

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if obj.profile_image and request:
            return request.build_absolute_uri(obj.profile_image.url)
        return None

    def get_cv_document_url(self, obj):
        request = self.context.get('request')
        if obj.cv_document and request:
            return request.build_absolute_uri(obj.cv_document.url)
        return None


# ── Medication ─────────────────────────────────────────────
class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'


# NOTE: Patient and Appointment use PyMongo (dicts), not DRF serializers.
# Their JSON formatting is done directly in clinic/views.py.
