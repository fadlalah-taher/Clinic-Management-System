#!/usr/bin/env python
"""
Seed script — Hybrid Method 3 (Django SQL + PyMongo).
- Superuser, Doctors, Medications  → SQLite (Django ORM)
- Patients, Appointments           → MongoDB (PyMongo)

Usage:  python seed.py
"""
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_project.settings')
django.setup()

from django.contrib.auth.models import User
from clinic.models import Doctor, Medication
from clinic.mongodb import patients_collection, appointments_collection

# ── Superuser ──────────────────────────────────────────────
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@clinic.com', 'admin1234')
    print('Created superuser: admin / admin1234')

# ── Doctors (SQL) ──────────────────────────────────────────
d1, _ = Doctor.objects.get_or_create(email='ali.hassan@clinic.com', defaults={
    'name': 'Ali Hassan', 'specialty': 'cardiology', 'phone': '+961-1-234567'
})
d2, _ = Doctor.objects.get_or_create(email='sara.khoury@clinic.com', defaults={
    'name': 'Sara Khoury', 'specialty': 'pediatrics', 'phone': '+961-3-987654'
})
d3, _ = Doctor.objects.get_or_create(email='marc.abi@clinic.com', defaults={
    'name': 'Marc Abi Nader', 'specialty': 'neurology', 'phone': '+961-70-111222'
})
print('Doctors seeded (SQL).')

# ── Medications (SQL) ──────────────────────────────────────
m1, _ = Medication.objects.get_or_create(name='Aspirin', defaults={
    'dosage': '100mg once daily', 'description': 'Blood thinner / analgesic'
})
m2, _ = Medication.objects.get_or_create(name='Amoxicillin', defaults={
    'dosage': '500mg three times daily', 'description': 'Broad-spectrum antibiotic'
})
m3, _ = Medication.objects.get_or_create(name='Paracetamol', defaults={
    'dosage': '1g up to 4 times daily', 'description': 'Fever reducer and pain relief'
})
print('Medications seeded (SQL).')

# ── Patients (MongoDB) ─────────────────────────────────────
now = datetime.utcnow().isoformat()

def get_or_create_patient(email, defaults):
    doc = patients_collection.find_one({'email': email})
    if doc is None:
        patients_collection.insert_one({'email': email, 'created_at': now, **defaults})
        doc = patients_collection.find_one({'email': email})
    return doc

p1 = get_or_create_patient('john.doe@mail.com', {
    'name': 'John Doe', 'date_of_birth': '1990-05-15',
    'phone': '+961-3-123456', 'address': ''
})
p2 = get_or_create_patient('maria.g@mail.com', {
    'name': 'Maria Georges', 'date_of_birth': '1985-08-22',
    'phone': '', 'address': 'Beirut, Lebanon'
})
p3 = get_or_create_patient('rami.k@mail.com', {
    'name': 'Rami Khalil', 'date_of_birth': '2000-01-10',
    'phone': '', 'address': ''
})
print('Patients seeded (MongoDB).')

# ── Appointments (MongoDB) ─────────────────────────────────
def get_or_create_appointment(patient_id, doctor_id, date, defaults):
    doc = appointments_collection.find_one({
        'patient_id': patient_id, 'doctor_id': doctor_id, 'date': date
    })
    if doc is None:
        appointments_collection.insert_one({
            'patient_id': patient_id, 'doctor_id': doctor_id,
            'date': date, 'created_at': now, **defaults
        })

get_or_create_appointment(
    str(p1['_id']), d1.id, '2026-05-01',
    {
        'contact_email': 'john.doe@mail.com',
        'reason': 'chest pain evaluation',
        'status': 'scheduled', 'duration': 45, 'is_first_visit': True,
        'symptoms': 'Shortness of breath, chest tightness',
        'notes': '',
        'medication_ids': [m1.id],
    }
)
get_or_create_appointment(
    str(p2['_id']), d2.id, '2026-04-20',
    {
        'contact_email': 'maria.g@mail.com',
        'reason': 'annual checkup',
        'status': 'completed', 'duration': 30, 'is_first_visit': False,
        'symptoms': '', 'notes': '',
        'medication_ids': [m3.id],
    }
)
get_or_create_appointment(
    str(p3['_id']), d3.id, '2026-05-10',
    {
        'contact_email': 'rami.k@mail.com',
        'reason': 'migraine follow-up',
        'status': 'scheduled', 'duration': 60, 'is_first_visit': False,
        'symptoms': 'Recurring migraines, visual aura',
        'notes': 'Monitor blood pressure',
        'medication_ids': [m2.id, m3.id],
    }
)
print('Appointments seeded (MongoDB).')
print('\nDone! Run: python manage.py runserver')
