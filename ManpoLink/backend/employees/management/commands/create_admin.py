from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from employees.models import Employee
from django.utils import timezone

class Command(BaseCommand):
    help = 'Create test admin with can_login=True'

    def handle(self, *args, **options):
        # Admin user
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'password': 'pbkdf2_sha256$390000$salt$hash123'  # Use make_password in shell
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('Admin created - password: admin123'))
        
        # Link Employee
        employee, created = Employee.objects.get_or_create(
            user=user,
            defaults={
                'firstname': 'Admin',
                'lastname': 'User',
                'position': 'Admin',
                'role': 'Admin',
                'employee_id': 'ADMIN001',
                'jtp_code': 'ADMIN001',
                'status': 'Active',
                'employment_type': 'Full-time',
                'can_login': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Admin employee created'))
        
        self.stdout.write(self.style.SUCCESS(f'Admin login: admin/admin123 | can_login: {employee.can_login}'))

