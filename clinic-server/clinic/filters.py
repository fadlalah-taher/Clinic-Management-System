from django_filters import rest_framework as filters
from .models import Doctor


class DoctorFilter(filters.FilterSet):
    specialty = filters.CharFilter(field_name='specialty', lookup_expr='icontains')
    name = filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = Doctor
        fields = ['specialty', 'name']


# Patient and Appointment filtering is handled manually in their PyMongo views.
