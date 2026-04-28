from django.contrib import admin
from .models import Doctor, Medication


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('name', 'specialty', 'email', 'phone', 'created_at')
    search_fields = ('name', 'email', 'specialty')
    list_filter = ('specialty',)


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'dosage', 'created_at')
    search_fields = ('name', 'dosage')


# Patient and Appointment are stored in MongoDB; no Django admin for them.
