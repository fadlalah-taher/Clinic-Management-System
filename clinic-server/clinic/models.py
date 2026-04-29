from django.db import models
from django.contrib.auth.models import User


class Doctor(models.Model):
    """
    Stored in SQLite (Django ORM).
    Represents a doctor in the clinic.
    """

    SPECIALTY_CHOICES = [
        ('cardiology', 'Cardiology'),
        ('neurology', 'Neurology'),
        ('orthopedics', 'Orthopedics'),
        ('pediatrics', 'Pediatrics'),
        ('dermatology', 'Dermatology'),
        ('general', 'General Practice'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200)
    specialty = models.CharField(max_length=100, choices=SPECIALTY_CHOICES, default='general')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_image = models.ImageField(upload_to='doctors/images/', blank=True, null=True)
    cv_document = models.FileField(upload_to='doctors/cv/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"Dr. {self.name} ({self.specialty})"


class Medication(models.Model):
    """
    Stored in SQLite (Django ORM).
    Represents a medication that can be prescribed in appointments.
    """

    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.dosage})"


# NOTE: Patient and Appointment are stored in MongoDB (PyMongo).
# See clinic/mongodb.py and clinic/views.py for their implementation.


class UserProfile(models.Model):
    """
    Extends Django's built-in User with a role (doctor or patient)
    and a link to the corresponding Doctor SQL record or MongoDB Patient ObjectId.
    """
    ROLE_CHOICES = [('doctor', 'Doctor'), ('patient', 'Patient')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    # For doctors: FK to the SQL Doctor record
    doctor = models.OneToOneField(
        Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profile'
    )
    # For patients: MongoDB ObjectId string
    patient_mongo_id = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"
