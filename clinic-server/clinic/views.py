"""
views.py — Hybrid Method 3
  - DoctorViewSet     : Django ORM (SQLite)
  - MedicationViewSet : Django ORM (SQLite)
  - PatientAPIView    : PyMongo (MongoDB)
  - AppointmentAPIView: PyMongo (MongoDB)
"""
from bson import ObjectId
from bson.errors import InvalidId

from rest_framework import viewsets, permissions, filters as drf_filters, status
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend


class IsAdminOrReadOnly(BasePermission):
    """Allow read (GET/HEAD/OPTIONS) to any authenticated user; write only to admins."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff

from .models import Doctor, Medication
from .serializers import DoctorSerializer, MedicationSerializer
from .filters import DoctorFilter
from .mongodb import patients_collection, appointments_collection


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _serialize_doc(doc):
    """Convert a MongoDB document to a JSON-serialisable dict."""
    if doc is None:
        return None
    doc['id'] = str(doc.pop('_id'))
    return doc


def _get_doctor_data(doctor_id):
    """Return a small dict snapshot of a SQL Doctor (or None)."""
    try:
        d = Doctor.objects.get(pk=int(doctor_id))
        return {
            'id': d.id,
            'name': d.name,
            'specialty': d.specialty,
            'email': d.email,
            'phone': d.phone,
        }
    except (Doctor.DoesNotExist, (ValueError, TypeError)):
        return None


def _get_patient_data(patient_id):
    """Return a small dict snapshot of a MongoDB Patient (or None)."""
    if not patient_id:
        return None
    try:
        doc = patients_collection.find_one({'_id': ObjectId(str(patient_id))})
        if doc is None:
            return None
        return {
            'id': str(doc['_id']),
            'name': doc.get('name', ''),
            'email': doc.get('email', ''),
            'phone': doc.get('phone', ''),
        }
    except Exception:
        return None


def _get_medication_data(med_ids):
    """Return a list of small Medication dicts for the given SQL ids."""
    if not med_ids:
        return []
    meds = Medication.objects.filter(pk__in=[int(i) for i in med_ids if i])
    return [{'id': m.id, 'name': m.name, 'dosage': m.dosage} for m in meds]


# ─────────────────────────────────────────────────────────────
# Doctor — Django ORM
# ─────────────────────────────────────────────────────────────

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class = DoctorFilter
    search_fields = ['name', 'email', 'specialty']
    ordering_fields = ['name', 'specialty', 'created_at']
    ordering = ['name']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'], url_path='appointments')
    def appointments(self, request, pk=None):
        """All MongoDB appointments for a specific doctor."""
        self.get_object()  # 404 if doctor not found in SQL
        cursor = appointments_collection.find({'doctor_id': int(pk)})
        results = []
        for doc in cursor:
            doc = _serialize_doc(doc)
            doc['doctor_detail'] = _get_doctor_data(doc.get('doctor_id'))
            doc['patient_detail'] = _get_patient_data(doc.get('patient_id'))
            doc['medications_detail'] = _get_medication_data(doc.get('medication_ids', []))
            results.append(doc)
        return Response(results)


# ─────────────────────────────────────────────────────────────
# Medication — Django ORM
# ─────────────────────────────────────────────────────────────

class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [drf_filters.SearchFilter, drf_filters.OrderingFilter]
    search_fields = ['name', 'dosage', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


# ─────────────────────────────────────────────────────────────
# Patient — PyMongo
# ─────────────────────────────────────────────────────────────

class PatientListCreateView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request):
        query = {}
        name = request.query_params.get('name')
        if name:
            import re
            query['name'] = {'$regex': re.escape(name), '$options': 'i'}
        search = request.query_params.get('search')
        if search:
            import re
            pattern = {'$regex': re.escape(search), '$options': 'i'}
            query['$or'] = [{'name': pattern}, {'email': pattern}, {'phone': pattern}]

        ordering = request.query_params.get('ordering', 'name')
        sort_field = ordering.lstrip('-')
        sort_dir = -1 if ordering.startswith('-') else 1

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        skip = (page - 1) * page_size

        total = patients_collection.count_documents(query)
        cursor = patients_collection.find(query).sort(sort_field, sort_dir).skip(skip).limit(page_size)
        results = []
        for doc in cursor:
            doc = _serialize_doc(doc)
            if doc.get('profile_image'):
                doc['profile_image_url'] = request.build_absolute_uri(f"/media/{doc['profile_image']}")
            results.append(doc)

        return Response({
            'count': total,
            'next': None,
            'previous': None,
            'results': results,
        })

    def post(self, request):
        data = request.data.copy()
        from datetime import datetime
        data['created_at'] = datetime.utcnow().isoformat()

        # Validate required fields
        errors = {}
        if not data.get('name'):
            errors['name'] = ['This field is required.']
        if not data.get('date_of_birth'):
            errors['date_of_birth'] = ['This field is required.']
        if not data.get('email'):
            errors['email'] = ['This field is required.']
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Unique email check
        if patients_collection.find_one({'email': data['email']}):
            return Response({'email': ['A patient with this email already exists.']},
                            status=status.HTTP_400_BAD_REQUEST)

        result = patients_collection.insert_one(dict(data))
        doc = patients_collection.find_one({'_id': result.inserted_id})
        return Response(_serialize_doc(doc), status=status.HTTP_201_CREATED)


class PatientDetailView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def _get_patient(self, pk):
        try:
            return patients_collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None

    def get(self, request, pk):
        doc = self._get_patient(pk)
        if doc is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        doc = _serialize_doc(doc)
        if doc.get('profile_image'):
            doc['profile_image_url'] = request.build_absolute_uri(f"/media/{doc['profile_image']}")
        if doc.get('health_book'):
            doc['health_book_url'] = request.build_absolute_uri(f"/media/{doc['health_book']}")
        return Response(doc)

    def put(self, request, pk):
        doc = self._get_patient(pk)
        if doc is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        # If email changed, check uniqueness
        if 'email' in data and data['email'] != doc.get('email'):
            if patients_collection.find_one({'email': data['email'], '_id': {'$ne': ObjectId(pk)}}):
                return Response({'email': ['A patient with this email already exists.']},
                                status=status.HTTP_400_BAD_REQUEST)

        patients_collection.update_one({'_id': ObjectId(pk)}, {'$set': dict(data)})
        updated = patients_collection.find_one({'_id': ObjectId(pk)})
        return Response(_serialize_doc(updated))

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        doc = self._get_patient(pk)
        if doc is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Also delete related appointments
        appointments_collection.delete_many({'patient_id': pk})
        patients_collection.delete_one({'_id': ObjectId(pk)})
        return Response(status=status.HTTP_204_NO_CONTENT)


class PatientAppointmentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            ObjectId(pk)
        except InvalidId:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if patients_collection.find_one({'_id': ObjectId(pk)}) is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        cursor = appointments_collection.find({'patient_id': pk})
        results = []
        for doc in cursor:
            doc = _serialize_doc(doc)
            doc['doctor_detail'] = _get_doctor_data(doc.get('doctor_id'))
            doc['medications_detail'] = _get_medication_data(doc.get('medication_ids', []))
            results.append(doc)
        return Response(results)


# ─────────────────────────────────────────────────────────────
# Appointment — PyMongo
# ─────────────────────────────────────────────────────────────

class AppointmentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = {}
        import re

        # Filtering
        appt_status = request.query_params.get('status')
        if appt_status:
            query['status'] = appt_status

        doctor = request.query_params.get('doctor')
        if doctor:
            query['doctor_id'] = int(doctor)

        patient = request.query_params.get('patient')
        if patient:
            query['patient_id'] = patient

        is_first = request.query_params.get('is_first_visit')
        if is_first is not None:
            query['is_first_visit'] = is_first.lower() in ('true', '1')

        date_after = request.query_params.get('date_after')
        if date_after:
            query.setdefault('date', {})['$gte'] = date_after

        date_before = request.query_params.get('date_before')
        if date_before:
            query.setdefault('date', {})['$lte'] = date_before

        search = request.query_params.get('search')
        if search:
            pattern = {'$regex': re.escape(search), '$options': 'i'}
            query['$or'] = [{'reason': pattern}, {'symptoms': pattern}, {'notes': pattern}]

        ordering = request.query_params.get('ordering', '-date')
        sort_field = ordering.lstrip('-')
        sort_dir = -1 if ordering.startswith('-') else 1

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        skip = (page - 1) * page_size

        total = appointments_collection.count_documents(query)
        cursor = appointments_collection.find(query).sort(sort_field, sort_dir).skip(skip).limit(page_size)

        results = []
        for doc in cursor:
            doc = _serialize_doc(doc)
            doc['doctor_detail'] = _get_doctor_data(doc.get('doctor_id'))
            doc['patient_detail'] = _get_patient_data(doc.get('patient_id'))
            doc['medications_detail'] = _get_medication_data(doc.get('medication_ids', []))
            results.append(doc)

        return Response({
            'count': total,
            'next': None,
            'previous': None,
            'results': results,
        })

    def post(self, request):
        data = request.data.copy()
        from datetime import datetime
        data['created_at'] = datetime.utcnow().isoformat()

        errors = {}
        if not data.get('patient_id'):
            errors['patient_id'] = ['This field is required.']
        if not data.get('doctor_id'):
            errors['doctor_id'] = ['This field is required.']
        if not data.get('date'):
            errors['date'] = ['This field is required.']
        if not data.get('reason'):
            errors['reason'] = ['This field is required.']
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Validate duration
        duration = data.get('duration', 30)
        try:
            duration = int(duration)
        except (ValueError, TypeError):
            duration = 30
        if duration > 180:
            return Response({'duration': ['Duration cannot exceed 180 minutes.']},
                            status=status.HTTP_400_BAD_REQUEST)
        data['duration'] = duration

        # Coerce types
        data['doctor_id'] = int(data['doctor_id'])
        data['is_first_visit'] = str(data.get('is_first_visit', 'false')).lower() in ('true', '1')
        data['status'] = data.get('status', 'scheduled')
        data['medication_ids'] = [int(i) for i in data.get('medication_ids', [])]

        result = appointments_collection.insert_one(dict(data))
        doc = appointments_collection.find_one({'_id': result.inserted_id})
        doc = _serialize_doc(doc)
        doc['doctor_detail'] = _get_doctor_data(doc.get('doctor_id'))
        doc['patient_detail'] = _get_patient_data(doc.get('patient_id'))
        doc['medications_detail'] = _get_medication_data(doc.get('medication_ids', []))
        return Response(doc, status=status.HTTP_201_CREATED)


class AppointmentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_appointment(self, pk):
        try:
            return appointments_collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None

    def get(self, request, pk):
        doc = self._get_appointment(pk)
        if doc is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        doc = _serialize_doc(doc)
        doc['doctor_detail'] = _get_doctor_data(doc.get('doctor_id'))
        doc['patient_detail'] = _get_patient_data(doc.get('patient_id'))
        doc['medications_detail'] = _get_medication_data(doc.get('medication_ids', []))
        return Response(doc)

    def put(self, request, pk):
        doc = self._get_appointment(pk)
        if doc is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()

        if 'duration' in data:
            try:
                data['duration'] = int(data['duration'])
            except (ValueError, TypeError):
                data['duration'] = 30
            if data['duration'] > 180:
                return Response({'duration': ['Duration cannot exceed 180 minutes.']},
                                status=status.HTTP_400_BAD_REQUEST)

        if 'doctor_id' in data:
            data['doctor_id'] = int(data['doctor_id'])
        if 'is_first_visit' in data:
            data['is_first_visit'] = str(data['is_first_visit']).lower() in ('true', '1')
        if 'medication_ids' in data:
            data['medication_ids'] = [int(i) for i in data['medication_ids']]

        appointments_collection.update_one({'_id': ObjectId(pk)}, {'$set': dict(data)})
        updated = appointments_collection.find_one({'_id': ObjectId(pk)})
        updated = _serialize_doc(updated)
        updated['doctor_detail'] = _get_doctor_data(updated.get('doctor_id'))
        updated['patient_detail'] = _get_patient_data(updated.get('patient_id'))
        updated['medications_detail'] = _get_medication_data(updated.get('medication_ids', []))
        return Response(updated)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        doc = self._get_appointment(pk)
        if doc is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        appointments_collection.delete_one({'_id': ObjectId(pk)})
        return Response(status=status.HTTP_204_NO_CONTENT)

