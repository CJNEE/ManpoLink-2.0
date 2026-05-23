import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from employees.models import Employee
from employees.serializers import EmployeeSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/')

employees = Employee.objects.all()
for emp in employees:
    print(f"Serializing {emp.full_name} (Role: {emp.role})")
    try:
        data = EmployeeSerializer(emp, context={'request': request}).data
        print(f"Success: {emp.full_name}")
    except Exception as e:
        print(f"FAILED for {emp.full_name}: {e}")
        import traceback
        traceback.print_exc()
