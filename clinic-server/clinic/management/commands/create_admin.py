"""
Management command: create_admin
Creates a default admin superuser for Django admin panel access.
Run once: python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create a default superuser for the Django admin panel.'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin', help='Admin username (default: admin)')
        parser.add_argument('--email', default='admin@clinicms.local', help='Admin email')
        parser.add_argument('--password', default='Admin@1234', help='Admin password')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(
                f'Superuser "{username}" already exists. No changes made.'
            ))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(
            f'Superuser created!\n'
            f'  username : {username}\n'
            f'  password : {password}\n'
            f'  url      : http://localhost:8000/admin/\n'
        ))
        self.stdout.write(self.style.WARNING(
            'IMPORTANT: Change the default password after your first login!'
        ))
