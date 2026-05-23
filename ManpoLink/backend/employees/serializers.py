import time
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from django.contrib.auth.models import User
from django.conf import settings
from .models import Hub, Employee, EditRequest, LeaveRequest, Attendance, LiveLocation, EmployeeDocument, Payroll, ActivityLog, SecurityAlert, HRPermission, SavedImage
from django.http import QueryDict

from .media_urls import absolute_media_url

class HRPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRPermission
        fields = [
            'id', 'hr_employee', 'can_view_employees', 'can_edit_employee_info',
            'can_edit_payslip', 'can_delete_employees', 'can_reset_password',
            'can_enable_employee_edit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class HubSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Hub
        fields = ['id', 'name', 'location', 'address', 'latitude', 'longitude', 'city', 'company', 'employee_count']
    
    def get_employee_count(self, obj):
        return obj.employees.count()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    jtp_code = serializers.CharField(source='employee.jtp_code', read_only=True)
    hub_name = serializers.CharField(source='employee.hub.name', read_only=True)
    city = serializers.CharField(source='employee.hub.city', read_only=True)
    clock_in_image = serializers.SerializerMethodField()
    clock_out_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'jtp_code', 'hub_name', 'city', 'date',
            'clock_in_time', 'clock_out_time', 'clock_in_image', 'clock_out_image',
            'permanent_clock_in_image_url', 'permanent_clock_out_image_url',
            'status',
        ]
    
    permanent_clock_in_image_url = serializers.SerializerMethodField()
    permanent_clock_out_image_url = serializers.SerializerMethodField()

    def get_permanent_clock_in_image_url(self, obj):
        from .models import SavedImage
        saved_image = SavedImage.objects.filter(attendance=obj, image_type='clock_in').first()
        if saved_image:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved_image.id}/")
        return None

    def get_permanent_clock_out_image_url(self, obj):
        from .models import SavedImage
        saved_image = SavedImage.objects.filter(attendance=obj, image_type='clock_out').first()
        if saved_image:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved_image.id}/")
        return None
    
    def get_clock_in_image(self, obj):
        # 1. Try permanent DB-backed URL first
        from .models import SavedImage
        saved = SavedImage.objects.filter(attendance=obj, image_type='clock_in').first()
        if saved and saved.image_data:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved.id}/")
            
        # 2. Fallback to filesystem URL
        if obj.clock_in_image:
            return absolute_media_url(self.context.get('request'), obj.clock_in_image.url)
        return None

    def get_clock_out_image(self, obj):
        # 1. Try permanent DB-backed URL first
        from .models import SavedImage
        saved = SavedImage.objects.filter(attendance=obj, image_type='clock_out').first()
        if saved and saved.image_data:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved.id}/")
            
        # 2. Fallback to filesystem URL
        if obj.clock_out_image:
            return absolute_media_url(self.context.get('request'), obj.clock_out_image.url)
        return None

# ✅ DEFINE THIS FIRST
class EmployeeDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    # Writable fields for POST/PUT/PATCH
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
    )
    file = serializers.FileField(write_only=True, required=True, allow_empty_file=False)
    
    class Meta:
        model = EmployeeDocument
        fields = [
            'id',
            'employee',
            'file',
            'file_url',
            'file_name',
            'file_size',
            'uploaded_at',
            'document_type',
        ]
        read_only_fields = ['id', 'file_url', 'file_name', 'file_size', 'uploaded_at', 'document_type']

    def get_file_url(self, obj):
        return absolute_media_url(self.context.get('request'), obj.file.url)





class EmployeeSerializer(serializers.ModelSerializer):
    hub_name = serializers.CharField(source='hub.name', read_only=True)
    hub_id = serializers.PrimaryKeyRelatedField(
        queryset=Hub.objects.all(),
        source='hub',
        write_only=True,
        required=False,
        allow_null=True,
        label='Hub ID'
    )
    user_info = UserSerializer(source='user', read_only=True)

    attendance_history = AttendanceSerializer(
        source='attendance_records',
        many=True,
        read_only=True
    )

    documents = EmployeeDocumentSerializer(many=True, read_only=True)
    hr_permissions = HRPermissionSerializer(read_only=True)

    profile_image_url = serializers.SerializerMethodField()
    permanent_profile_image_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'

        extra_kwargs = {
            'employment_type': {'required': False},
            'status': {'required': False},
            'hub': {'required': False},
            'hired_date': {'required': False},
            'can_login': {'required': False}
        }

    def get_full_name(self, obj):
        return f"{obj.firstname} {obj.middle_initial} {obj.lastname}".strip()

    def get_profile_image_url(self, obj):
        # 1. Try permanent DB-backed URL first
        from .models import SavedImage
        saved = obj.saved_images.filter(image_type='profile').first()
        if saved and saved.image_data:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved.id}/")
            
        # 2. Fallback to filesystem URL
        if obj.profile_image:
            return absolute_media_url(self.context.get('request'), obj.profile_image.url)
        return None

    def get_permanent_profile_image_url(self, obj):
        from .models import SavedImage
        saved_image = obj.saved_images.filter(image_type='profile').first()
        if saved_image:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved_image.id}/")
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        req = self.context.get('request')
        
        # Prioritize permanent DB-backed URL for the main profile_image field too
        from .models import SavedImage
        saved = instance.saved_images.filter(image_type='profile').first()
        if saved and saved.image_data:
            data['profile_image'] = absolute_media_url(req, f"/api/saved-images/{saved.id}/")
        else:
            pi = data.get('profile_image')
            if isinstance(pi, str) and pi.startswith('/'):
                data['profile_image'] = absolute_media_url(req, pi)
        
        return data

class EmployeeCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    
    FIELD_NAME_MAP = {
        'firstName': 'firstname',
        'lastName': 'lastname',
        'middleInitial': 'middle_initial',
        'placeOfBirth': 'place_of_birth',
        'dateOfBirth': 'date_of_birth',
        'maritalStatus': 'marital_status',
        'email': 'email_address',
        'phone': 'phone_number',
        'currentAddress': 'current_address',
        'permanentAddress': 'permanent_address',
        'employmentType': 'employment_type',
        'hireDate': 'hired_date',
        'jtpCode': 'jtp_code',
        'employeeId': 'employee_id',
        'emergencyContactName': 'emergency_contact_name',
        'emergencyContactPhone': 'emergency_contact_phone',
        'canEditInfo': 'can_edit_info',
        'isActive': 'is_active',
        'profileImage': 'profile_image',
    }

    class Meta:
        model = Employee
        fields = '__all__'
    
    def to_internal_value(self, data):
        # Normalize incoming data which may be a QueryDict (multipart/form-data)
        # QueryDict when cast to dict produces lists for each key. Convert
        # single-item lists to plain values so serializer field validators
        # receive scalars instead of lists.
        mutable_data = {}
        if isinstance(data, QueryDict):
            for key in data.keys():
                values = data.getlist(key)
                if len(values) == 1:
                    mutable_data[key] = values[0]
                else:
                    mutable_data[key] = values
        else:
            # Regular dict-like input (could contain lists)
            for key, val in dict(data).items():
                if isinstance(val, (list, tuple)) and len(val) == 1:
                    mutable_data[key] = val[0]
                else:
                    mutable_data[key] = val

        for source_key, target_key in self.FIELD_NAME_MAP.items():
            if source_key in mutable_data:
                mutable_data[target_key] = mutable_data.pop(source_key)

        if mutable_data.get('email_address') in ('', None, 'null'):
            mutable_data['email_address'] = None
        if mutable_data.get('phone_number') in ('', None, 'null'):
            mutable_data['phone_number'] = None

        date_fields = ['date_of_birth', 'drivers_license_expiry', 'hired_date']
        for field in date_fields:
            if mutable_data.get(field) in ('', None, 'null'):
                mutable_data[field] = None

        for boolean_field in ['can_login', 'can_edit_info', 'is_active']:
            if mutable_data.get(boolean_field) in ('true', '1', 1, True):
                mutable_data[boolean_field] = True
            elif mutable_data.get(boolean_field) in ('false', '0', 0, False, ''):
                mutable_data[boolean_field] = False

        return super().to_internal_value(mutable_data)
    
    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        role = validated_data.get('role', 'Employee')
        is_staff = role in ['HR', 'Admin']

        # Auto-generate employee_id if missing/empty
        validated_data['employee_id'] = validated_data.get('employee_id') or validated_data.get('jtp_code') or f'EMP{int(time.time())}'

        with transaction.atomic():
            employee = Employee.objects.create(**validated_data)

            if password:
                if not username:
                    username = validated_data.get('jtp_code') or validated_data.get('employee_id')

                if not username:
                    base_username = slugify(f"{employee.firstname}-{employee.lastname}") or 'user'
                    username = base_username
                    count = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{count}"
                        count += 1

                user = User.objects.create_user(
                    username=username,
                    password=password,
                    first_name=employee.firstname,
                    last_name=employee.lastname,
                    is_staff=is_staff,
                    is_superuser=(role == 'Admin')
                )
                employee.user = user
                employee.save()

        return employee


class PayrollSerializer(serializers.ModelSerializer):
    fullname = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='employee.full_name', read_only=True)
    position = serializers.CharField(source='employee.position', read_only=True)
    date_hired = serializers.DateField(source='employee.hired_date', read_only=True)
    jtp_code = serializers.CharField(source='employee.jtp_code', read_only=True)
    hub = serializers.SerializerMethodField()
    hub_name = serializers.CharField(source='employee.hub.name', read_only=True)
    profile_image = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    payslip_period = serializers.SerializerMethodField()
    payslip_image_url = serializers.SerializerMethodField()
    total_earnings = serializers.SerializerMethodField()
    total_deductions = serializers.SerializerMethodField()
    total_government_deductions = serializers.SerializerMethodField()

    tin = serializers.CharField(source='employee.tin', read_only=True)
    sss_no = serializers.CharField(source='employee.sss', read_only=True)
    philhealth_no = serializers.CharField(source='employee.philhealth', read_only=True)
    pagibig_no = serializers.CharField(source='employee.pagibig', read_only=True)

    # compute attendance summary live so UI always shows accurate values
    total_hours = serializers.SerializerMethodField()
    overtime_hours = serializers.SerializerMethodField()
    lates = serializers.SerializerMethodField()
    absences = serializers.SerializerMethodField()

    # Government deduction percents (writable overrides) and computed amounts (derived)
    sss_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    philhealth_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    pagibig_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)

    sss_deduction = serializers.SerializerMethodField()
    philhealth_deduction = serializers.SerializerMethodField()
    pagibig_deduction = serializers.SerializerMethodField()
    
    class Meta:
        model = Payroll
        fields = [
            'id', 'fullname', 'full_name', 'jtp_code', 'position', 'date_hired', 'hub', 'hub_name',
            'tin', 'sss_no', 'philhealth_no', 'pagibig_no',
            'net_pay', 'status',
            'employee', 'period_start', 'period_end', 'payslip_period',
            'total_hours', 'overtime_hours', 'lates', 'absences',
            # Earnings
            'standard_pay', 'basic_salary', 'overtime_pay', 'night_differential', 'ndot',
            'rest_day', 'rest_day_ot', 'rest_day_nd', 'rest_day_ndot',
            'special_holiday', 'special_holiday_ot', 'special_holiday_nd', 'special_holiday_ndot',
            'legal_holiday', 'legal_holiday_ot', 'legal_holiday_nd', 'legal_holiday_ndot',
            'legal_holiday_rd', 'legal_holiday_rdot', 'legal_holiday_rdnd', 'legal_holiday_rdndot',
            'incentives', 'adjustment', 'gas', 'load', 'other_allowance', 'rewards_adjustments', 'kpi',
            'allowances',
            # Deductions
            'late', 'id_deduction', 'uniform', 'insurance', 'surety_bond', 'convenience_fee', 'general_deduction',
            'total_earnings', 'deduction_details', 'total_deductions',
            # derived government deduction fields (percent + amount)
            'sss_percent', 'sss_deduction',
            'philhealth_percent', 'philhealth_deduction',
            'pagibig_percent', 'pagibig_deduction',
            'total_government_deductions',
            'payslip_image', 'payslip_image_url',
            'profile_image', 'profile_image_url',
            'created_at', 'updated_at'
        ]
    
    def get_fullname(self, obj):
        if obj.employee:
            firstname = getattr(obj.employee, 'firstname', '') or ''
            lastname = getattr(obj.employee, 'lastname', '') or ''
            return f"{firstname} {lastname}".strip()
        return ''

    def get_hub(self, obj):
        if obj.employee and getattr(obj.employee, 'hub', None):
            return obj.employee.hub.name or ''
        return ''

    def get_profile_image(self, obj):
        if not obj.employee:
            return None
        
        from .models import SavedImage
        saved = obj.employee.saved_images.filter(image_type='profile').first()
        if saved and saved.image_data:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved.id}/")
            
        if obj.employee.profile_image:
            return absolute_media_url(self.context.get('request'), obj.employee.profile_image.url)
        return None

    def get_profile_image_url(self, obj):
        return self.get_profile_image(obj)

    def get_payslip_period(self, obj):
        if obj.period_start and obj.period_end:
            return f"{obj.period_start} - {obj.period_end}"
        return None

    def get_total_earnings(self, obj):
        return float(
            (obj.standard_pay or 0) +
            (obj.basic_salary or 0) +
            (obj.overtime_pay or 0) +
            (obj.night_differential or 0) +
            (obj.ndot or 0) +
            (obj.rest_day or 0) +
            (obj.rest_day_ot or 0) +
            (obj.rest_day_nd or 0) +
            (obj.rest_day_ndot or 0) +
            (obj.special_holiday or 0) +
            (obj.special_holiday_ot or 0) +
            (obj.special_holiday_nd or 0) +
            (obj.special_holiday_ndot or 0) +
            (obj.legal_holiday or 0) +
            (obj.legal_holiday_ot or 0) +
            (obj.legal_holiday_nd or 0) +
            (obj.legal_holiday_ndot or 0) +
            (obj.legal_holiday_rd or 0) +
            (obj.legal_holiday_rdot or 0) +
            (obj.legal_holiday_rdnd or 0) +
            (obj.legal_holiday_rdndot or 0) +
            (obj.incentives or 0) +
            (obj.adjustment or 0) +
            (obj.gas or 0) +
            (obj.load or 0) +
            (obj.other_allowance or 0) +
            (obj.rewards_adjustments or 0) +
            (obj.kpi or 0) +
            (obj.allowances or 0)
        )

    def get_total_deductions(self, obj):
        deductions = (
            float(obj.late or 0) +
            float(obj.sss_deduction or 0) +
            float(obj.philhealth_deduction or 0) +
            float(obj.pagibig_deduction or 0) +
            float(obj.id_deduction or 0) +
            float(obj.uniform or 0) +
            float(obj.insurance or 0) +
            float(obj.surety_bond or 0) +
            float(obj.convenience_fee or 0) +
            float(obj.general_deduction or 0)
        )
        if isinstance(obj.deduction_details, dict):
            deductions += sum(float(value or 0) for value in obj.deduction_details.values())
        return float(deductions)

    def _get_total_earnings_decimal(self, obj):
        from decimal import Decimal
        return Decimal(str(self.get_total_earnings(obj)))

    def _resolve_gov_rates(self, obj):
        """Return dict of percents for sss/philhealth/pagibig (floats)."""
        from django.conf import settings
        FALLBACK = {'sss': 4.5, 'philhealth': 2.75, 'pagibig': 1.0}
        try:
            hub = getattr(obj.employee, 'hub', None)
            # Prefer Hub model explicit fields when provided
            if hub:
                s = float(getattr(hub, 'sss_rate', 0) or 0)
                ph = float(getattr(hub, 'philhealth_rate', 0) or 0)
                pg = float(getattr(hub, 'pagibig_rate', 0) or 0)
                if s > 0 or ph > 0 or pg > 0:
                    return {'sss': s or FALLBACK['sss'], 'philhealth': ph or FALLBACK['philhealth'], 'pagibig': pg or FALLBACK['pagibig']}

            hub_key = getattr(hub, 'name', None) if hub else None
            cfg = getattr(settings, 'HUB_DEDUCTION_RATES', None)
            default_cfg = getattr(settings, 'DEFAULT_GOV_RATES', None)
            if cfg and hub_key and hub_key in cfg:
                return cfg.get(hub_key)
            if default_cfg:
                return default_cfg
        except Exception:
            pass
        return FALLBACK

    def _get_effective_percent(self, obj, key):
        """Return payroll stored percent when >0, otherwise resolve from hub/settings fallback."""
        try:
            if key == 'sss':
                val = getattr(obj, 'sss_percent', None)
            elif key == 'philhealth':
                val = getattr(obj, 'philhealth_percent', None)
            else:
                val = getattr(obj, 'pagibig_percent', None)

            if val is not None and float(val) > 0:
                return float(val)
        except Exception:
            pass

        rates = self._resolve_gov_rates(obj)
        mapping = {'sss': 'sss', 'philhealth': 'philhealth', 'pagibig': 'pagibig'}
        return float(rates.get(mapping.get(key, key), 4.5 if key == 'sss' else 2.75 if key == 'philhealth' else 1.0))

    def get_sss_deduction(self, obj):
        from decimal import Decimal, ROUND_HALF_UP
        total = self._get_total_earnings_decimal(obj)
        pct = Decimal(str(self._get_effective_percent(obj, 'sss'))) / Decimal('100')
        return float((total * pct).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

    def get_philhealth_deduction(self, obj):
        from decimal import Decimal, ROUND_HALF_UP
        total = self._get_total_earnings_decimal(obj)
        pct = Decimal(str(self._get_effective_percent(obj, 'philhealth'))) / Decimal('100')
        return float((total * pct).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

    def get_pagibig_deduction(self, obj):
        from decimal import Decimal, ROUND_HALF_UP
        total = self._get_total_earnings_decimal(obj)
        pct = Decimal(str(self._get_effective_percent(obj, 'pagibig'))) / Decimal('100')
        return float((total * pct).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data['sss_percent'] = float(self._get_effective_percent(instance, 'sss'))
            data['philhealth_percent'] = float(self._get_effective_percent(instance, 'philhealth'))
            data['pagibig_percent'] = float(self._get_effective_percent(instance, 'pagibig'))
        except Exception:
            pass
        return data

    def validate(self, attrs):
        errors = {}
        for key in ('sss_percent', 'philhealth_percent', 'pagibig_percent'):
            if key in attrs and attrs.get(key) is not None:
                try:
                    v = float(attrs.get(key))
                    if v < 0 or v > 100:
                        errors[key] = 'Must be between 0 and 100'
                except Exception:
                    errors[key] = 'Invalid number'
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def get_total_government_deductions(self, obj):
        return float(
            (self.get_sss_deduction(obj) or 0) +
            (self.get_philhealth_deduction(obj) or 0) +
            (self.get_pagibig_deduction(obj) or 0)
        )

    def get_total_government_deductions(self, obj):
        # legacy model fields should not be used here; government deductions are computed from earnings
        return float(
            (self.get_sss_deduction(obj) or 0) +
            (self.get_philhealth_deduction(obj) or 0) +
            (self.get_pagibig_deduction(obj) or 0)
        )

    def get_payslip_image_url(self, obj):
        # 1. Try permanent DB-backed URL first
        from .models import SavedImage
        saved = SavedImage.objects.filter(employee=obj.employee, image_type='payslip', description__contains=str(obj.period_start)).first()
        if saved and saved.image_data:
            return absolute_media_url(self.context.get('request'), f"/api/saved-images/{saved.id}/")
            
        # 2. Fallback to filesystem URL
        if obj.payslip_image:
            return absolute_media_url(self.context.get('request'), obj.payslip_image.url)
        return None

    def _get_cumulative_start(self, obj):
        from datetime import date
        return date(obj.period_end.year, obj.period_end.month, 1)

    # Attendance-derived fields (computed live)
    def get_total_hours(self, obj):
        try:
            from datetime import timedelta
            total_seconds = 0.0
            cumulative_start = self._get_cumulative_start(obj)
            qs = obj.employee.attendance_records.filter(date__gte=cumulative_start, date__lte=obj.period_end)
            from django.utils import timezone as djtz
            today = djtz.now().date()
            for a in qs:
                if a.clock_in_time and a.clock_out_time:
                    diff = (a.clock_out_time - a.clock_in_time).total_seconds()
                    if diff > 0:
                        total_seconds += diff
                elif a.clock_in_time and not a.clock_out_time:
                    # approximate until now if it's today's record
                    try:
                        if a.date == today:
                            diff = (djtz.now() - a.clock_in_time).total_seconds()
                            if diff > 0:
                                total_seconds += diff
                    except Exception:
                        pass
            return float(round(total_seconds / 3600.0, 2))
        except Exception:
            return float(obj.total_hours or 0)

    def get_overtime_hours(self, obj):
        try:
            from datetime import timedelta
            overtime_seconds = 0.0
            STANDARD_DAY_HOURS = 8
            cumulative_start = self._get_cumulative_start(obj)
            qs = obj.employee.attendance_records.filter(date__gte=cumulative_start, date__lte=obj.period_end)
            from django.utils import timezone as djtz
            today = djtz.now().date()
            for a in qs:
                if a.clock_in_time and a.clock_out_time:
                    diff = (a.clock_out_time - a.clock_in_time).total_seconds()
                    if diff > 0:
                        hours = diff / 3600.0
                        if hours > STANDARD_DAY_HOURS:
                            overtime_seconds += (hours - STANDARD_DAY_HOURS) * 3600.0
                elif a.clock_in_time and not a.clock_out_time:
                    try:
                        if a.date == today:
                            diff = (djtz.now() - a.clock_in_time).total_seconds()
                            hours = diff / 3600.0
                            if hours > STANDARD_DAY_HOURS:
                                overtime_seconds += (hours - STANDARD_DAY_HOURS) * 3600.0
                    except Exception:
                        pass
            return float(round(overtime_seconds / 3600.0, 2))
        except Exception:
            return float(obj.overtime_hours or 0)

    def get_lates(self, obj):
        try:
            LATE_HOUR = 10
            count = 0
            cumulative_start = self._get_cumulative_start(obj)
            qs = obj.employee.attendance_records.filter(date__gte=cumulative_start, date__lte=obj.period_end)
            for a in qs:
                if a.clock_in_time and getattr(a.clock_in_time, 'hour', None) is not None:
                    if a.clock_in_time.hour >= LATE_HOUR:
                        count += 1
            return int(count)
        except Exception:
            return int(obj.lates or 0)

    def get_absences(self, obj):
        try:
            from datetime import timedelta
            def count_weekdays(start, end):
                days = 0
                cur = start
                while cur <= end:
                    if cur.weekday() < 5:
                        days += 1
                    cur += timedelta(days=1)
                return days

            cumulative_start = self._get_cumulative_start(obj)
            working_days = count_weekdays(cumulative_start, obj.period_end)
            qs = obj.employee.attendance_records.filter(date__gte=cumulative_start, date__lte=obj.period_end)
            present_days = set()
            for a in qs:
                if a.clock_in_time:
                    present_days.add(a.date)

            approved_leaves = LeaveRequest.objects.filter(employee=obj.employee, status='approved')
            leave_days = 0
            for lr in approved_leaves:
                ls = lr.start_date
                le = lr.end_date
                overlap_start = max(ls, cumulative_start)
                overlap_end = min(le, obj.period_end)
                if overlap_start <= overlap_end:
                    leave_days += count_weekdays(overlap_start, overlap_end)

            absences_count = max(0, working_days - len(present_days) - leave_days)
            return int(absences_count)
        except Exception:
            return int(obj.absences or 0)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        req = self.context.get('request')
        img = data.get('payslip_image')
        if isinstance(img, str) and img.startswith('/'):
            data['payslip_image'] = absolute_media_url(req, img)
        return data

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee',
            'employee_name',
            'leave_type',
            'start_date',
            'end_date',
            'reason',
            'status',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'notes',
            'created_at',
            'attachments',
        ]

    def get_attachments(self, obj):
        try:
            request = self.context.get('request')
            items = []
            from .models import SavedImage
            
            # Prefer SavedImage (DB-persistent) URLs
            saved_images = SavedImage.objects.filter(leave_attachment__leave_request=obj, image_type='leave_attachment')
            if saved_images.exists():
                for si in saved_images:
                    items.append(absolute_media_url(request, f"/api/saved-images/{si.id}/"))
                return items
            
            # Fallback to filesystem URLs
            for att in obj.attachments.all():
                if att.file:
                    items.append(absolute_media_url(request, att.file.url))
            return items
        except Exception as e:
            print(f"[LeaveRequestSerializer] Error: {e}")
            return []

    def get_employee_name(self, obj):
        try:
            return f"{obj.employee.firstname} {obj.employee.lastname}"
        except Exception:
            return 'N/A'

    def get_reviewed_by_name(self, obj):
        try:
            user = obj.reviewed_by
            if not user:
                return None
            # Prefer full name, fallback to username
            full = getattr(user, 'first_name', '') or ''
            last = getattr(user, 'last_name', '') or ''
            name = f"{full} {last}".strip()
            if name:
                return name
            return getattr(user, 'username', None)
        except Exception:
            return None


class EditRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    changes_preview = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = EditRequest
        fields = [
            'id', 'employee', 'employee_name', 'changes_preview',
            'requested_data', 'status', 'reviewed_by', 'reviewed_at',
            'image_url', 'notes', 'created_at'
        ]

    def get_employee_name(self, obj):
        try:
            return f"{obj.employee.firstname} {obj.employee.lastname}"
        except:
            return "N/A"

    def get_changes_preview(self, obj):
        changes = []
        for field, value in (obj.requested_data or {}).items():
            changes.append(f"{field}: {str(value)[:30]}")
        return ", ".join(changes)

    def get_image_url(self, obj):
        try:
            request = self.context.get('request')
            # 1. Try permanent DB-backed URL first
            from .models import SavedImage
            saved = SavedImage.objects.filter(edit_request=obj, image_type='edit_request').first()
            if saved and saved.image_data:
                return absolute_media_url(request, f"/api/saved-images/{saved.id}/")
                
            # 2. Fallback to filesystem URL
            if obj.uploaded_files:
                return absolute_media_url(request, obj.uploaded_files.url)
        except Exception:
            pass
        return None

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class LoginResponseSerializer(serializers.Serializer):
    user = UserSerializer()
    employee = EmployeeSerializer()
    token = serializers.CharField(required=False)

class LiveLocationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    distance_from_hub = serializers.SerializerMethodField()
    
    class Meta:
        model = LiveLocation
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'latitude', 'longitude',
            'timestamp', 'distance_from_hub'
        ]
    
    def get_distance_from_hub(self, obj):
        try:
            hub = obj.employee.hub
            if hub:
                from math import radians, sin, cos, sqrt, atan2
                lat1, lon1 = radians(hub.latitude), radians(hub.longitude)
                lat2, lon2 = radians(obj.latitude), radians(obj.longitude)
                dlat, dlon = lat2 - lat1, lon2 - lon1
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                distance = 6371 * c
                return round(distance, 1)
        except:
            pass
        return None

class CreateEmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'firstname', 'lastname', 'middle_initial', 'position',  'employment_type', 'role', 
            'hub', 'employee_id', 'jtp_code', 'phone_number', 'email_address', 'current_address',
            'username', 'password', 'can_login'
        ]
    
    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        
        employee = Employee.objects.create(**validated_data)
        employee.user = User.objects.create_user(
            username=username, password=password,
            first_name=validated_data.get('firstname', ''),
            last_name=validated_data.get('lastname', '')
        )
        employee.save()
        return employee


# ===================== ACTIVITY LOG SERIALIZER =====================

class ActivityLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    formatted_date = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'employee', 'employee_name', 'role', 'action', 
            'details', 'ip_address', 'created_at', 'formatted_date'
        ]
    
    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.firstname} {obj.employee.lastname}"
        if obj.user:
            return obj.user.username
        return "Unknown"


# ===================== SECURITY ALERT SERIALIZER =====================

class SecurityAlertSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    formatted_date = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = SecurityAlert
        fields = [
            'id', 'employee', 'employee_name', 'alert_type', 'severity',
            'message', 'details', 'is_resolved', 'resolved_by', 'resolved_at',
            'created_at', 'formatted_date'
        ]
    
    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.firstname} {obj.employee.lastname}"
        return "Unknown"


# ===================== SAVED IMAGE SERIALIZER =====================

class SavedImageSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SavedImage
        fields = [
            'id', 'employee', 'employee_name', 'image', 'image_url',
            'image_type', 'is_active', 'is_approved', 'description',
            'edit_request', 'attendance', 'leave_attachment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        try:
            return f"{obj.employee.firstname} {obj.employee.lastname}"
        except:
            return "Unknown"
    
    def get_image_url(self, obj):
        try:
            if obj.image:
                return absolute_media_url(self.context.get('request'), obj.image.url)
        except:
            pass
        return None
