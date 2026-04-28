from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Doctor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('specialty', models.CharField(
                    choices=[('cardiology', 'Cardiology'), ('neurology', 'Neurology'),
                             ('orthopedics', 'Orthopedics'), ('pediatrics', 'Pediatrics'),
                             ('dermatology', 'Dermatology'), ('general', 'General Practice'), ('other', 'Other')],
                    default='general', max_length=100)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('profile_image', models.ImageField(blank=True, null=True, upload_to='doctors/images/')),
                ('cv_document', models.FileField(blank=True, null=True, upload_to='doctors/cv/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='Medication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('dosage', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='Patient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('date_of_birth', models.DateField()),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('address', models.TextField(blank=True)),
                ('profile_image', models.ImageField(blank=True, null=True, upload_to='patients/images/')),
                ('medical_report', models.FileField(blank=True, null=True, upload_to='patients/reports/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='Appointment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('contact_email', models.EmailField(max_length=254)),
                ('reason', models.CharField(max_length=300)),
                ('status', models.CharField(
                    choices=[('scheduled', 'Scheduled'), ('completed', 'Completed'), ('cancelled', 'Cancelled')],
                    default='scheduled', max_length=20)),
                ('duration', models.PositiveIntegerField(default=30, help_text='Duration in minutes (max 180)')),
                ('is_first_visit', models.BooleanField(default=False)),
                ('symptoms', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                             related_name='appointments', to='clinic.doctor')),
                ('medications', models.ManyToManyField(blank=True, related_name='appointments', to='clinic.medication')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                              related_name='appointments', to='clinic.patient')),
            ],
            options={'ordering': ['-date']},
        ),
    ]
