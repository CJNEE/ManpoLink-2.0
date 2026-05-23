import os
import sys
import pathlib
import django

# Ensure project root is on sys.path so Django settings can be imported
project_root = pathlib.Path(__file__).resolve().parents[1]
# Add the Django project package directory (backend/) to sys.path so 'backend.settings' can be imported
sys.path.append(str(project_root / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from employees.models import Employee

username = 'hr_test'
password = 'TestPass123'
email = 'hr_test@example.com'

user, created = User.objects.get_or_create(username=username, defaults={'email': email})
if created:
    user.set_password(password)
    user.save()
    print('Created user', username)
else:
    print('User exists')

# Create or update employee
emp_defaults = {
    'firstname': 'HR',
    'lastname': 'Test',
    'position': 'HR Manager',
    'employment_type': 'Full-time',
    'status': 'Active',
    'role': 'HR',
    'employee_id': 'EMP-HR-TEST',
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
        print('Updated employee fields and role to HR')
    else:
        print('Employee exists and already configured')
else:
    print('Created employee record')

print('Done')
