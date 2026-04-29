"""
Management command: send_reminders
Sends email reminders to patients with appointments scheduled for tomorrow.

Usage:
    python manage.py send_reminders

Schedule this command to run daily via cron or a task scheduler:
    # Example crontab entry (runs every day at 8 AM)
    0 8 * * * /path/to/venv/bin/python /path/to/manage.py send_reminders
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings

from clinic.mongodb import appointments_collection, patients_collection
from clinic.models import Doctor


class Command(BaseCommand):
    help = 'Send email reminders for appointments scheduled for tomorrow.'

    def handle(self, *args, **options):
        tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        self.stdout.write(f'Checking appointments for {tomorrow}…')

        cursor = appointments_collection.find(
            {'date': tomorrow, 'status': 'scheduled'}
        )

        sent = 0
        skipped = 0

        for appt in cursor:
            patient_id = appt.get('patient_id', '')
            doctor_id = appt.get('doctor_id')
            reason = appt.get('reason', 'medical appointment')
            contact_email = appt.get('contact_email', '')

            # Resolve patient info from MongoDB
            patient_name = 'Patient'
            patient_email = contact_email
            if patient_id:
                try:
                    from bson import ObjectId
                    patient = patients_collection.find_one({'_id': ObjectId(patient_id)})
                    if patient:
                        patient_name = patient.get('name', 'Patient')
                        patient_email = contact_email or patient.get('email', '')
                except Exception:
                    pass

            # Resolve doctor name from SQLite
            doctor_name = 'your doctor'
            if doctor_id:
                try:
                    doctor = Doctor.objects.get(pk=int(doctor_id))
                    doctor_name = f'Dr. {doctor.name} ({doctor.specialty})'
                except Doctor.DoesNotExist:
                    pass

            if not patient_email:
                self.stdout.write(self.style.WARNING(
                    f'  ⚠ No email for appointment {appt.get("_id")} — skipped.'
                ))
                skipped += 1
                continue

            subject = f'Reminder: Appointment Tomorrow ({tomorrow})'
            message = (
                f'Dear {patient_name},\n\n'
                f'This is a friendly reminder that you have an appointment scheduled '
                f'for tomorrow, {tomorrow}, with {doctor_name}.\n\n'
                f'Reason: {reason}\n'
                f'Duration: {appt.get("duration", 30)} minutes\n\n'
                f'Please arrive a few minutes early. If you need to cancel or '
                f'reschedule, contact the clinic as soon as possible.\n\n'
                f'Best regards,\n'
                f'ClinicMS Team'
            )

            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [patient_email],
                    fail_silently=False,
                )
                sent += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ Reminder sent → {patient_email}'
                ))
            except Exception as exc:
                self.stdout.write(self.style.ERROR(
                    f'  ✗ Failed to send to {patient_email}: {exc}'
                ))
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {sent} reminder(s) sent, {skipped} skipped.'
        ))
