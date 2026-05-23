import os
import sys
import pathlib
import django

project_root = pathlib.Path(__file__).resolve().parents[1]
sys.path.append(str(project_root / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from employees.models import Employee

username = 'admin_test'
password = 'AdminPass123'
email = 'admin_test@example.com'

user, created = User.objects.get_or_create(username=username, defaults={'email': email})
if created:
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print('Created admin user', username)
else:
    print('User exists')

emp_defaults = {
    'firstname': 'Admin',
    'lastname': 'Test',
    'position': 'Administrator',
    'employment_type': 'Full-time',
    'status': 'Active',
    'role': 'Admin',
    'employee_id': 'EMP-ADMIN-TEST',
    'can_login': True
}
emp, ecreated = Employee.objects.get_or_create(user=user, defaults=emp_defaults)
if not ecreated:
    updated = False
    for k, v in emp_defaults.items():
        if getattr(emp, k, None) != v:
            setattr(emp, k, v)
            updated = True
    if updated:
        emp.save()
        print('Updated employee fields and role to Admin')
    else:
        print('Employee exists and already configured')
else:
    print('Created employee record')

print('Done')
