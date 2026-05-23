import os, sys, pathlib
project_root = pathlib.Path(__file__).resolve().parents[1]
sys.path.append(str(project_root / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from employees.models import Employee
from collections import Counter

roles = [e.role for e in Employee.objects.all()]
print(Counter(roles))
