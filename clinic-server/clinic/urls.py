from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorViewSet,
    MedicationViewSet,
    PatientListCreateView,
    PatientDetailView,
    PatientAppointmentsView,
    AppointmentListCreateView,
    AppointmentDetailView,
)

# SQL-backed resources use the DRF router
router = DefaultRouter()
router.register('doctors', DoctorViewSet, basename='doctor')
router.register('medications', MedicationViewSet, basename='medication')

urlpatterns = [
    path('', include(router.urls)),

    # MongoDB-backed patients
    path('patients/', PatientListCreateView.as_view(), name='patient-list'),
    path('patients/<str:pk>/', PatientDetailView.as_view(), name='patient-detail'),
    path('patients/<str:pk>/appointments/', PatientAppointmentsView.as_view(), name='patient-appointments'),

    # MongoDB-backed appointments
    path('appointments/', AppointmentListCreateView.as_view(), name='appointment-list'),
    path('appointments/<str:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
]
