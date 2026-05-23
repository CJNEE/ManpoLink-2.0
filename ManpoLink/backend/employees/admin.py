from django.contrib import admin
from django.utils.safestring import mark_safe
from .models import Hub, Employee, Attendance, EditRequest, LiveLocation , Payroll ,EmployeeDocument,LeaveRequest, LeaveAttachment
@admin.register(Hub)
class HubAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'employee_count', 'sss_rate', 'philhealth_rate', 'pagibig_rate']
    list_filter = ['name']
    search_fields = ['name', 'location', 'address']
    readonly_fields = ['employee_count']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['firstname', 'lastname', 'position', 'status', 'role', 'can_login', 'hub']
    list_filter = ['status', 'role', 'employment_type', 'hub']
    search_fields = ['firstname', 'lastname', 'employee_id', 'email_address', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'clock_in_time', 'clock_out_time', 'status']
    list_filter = ['date', 'status', 'employee']
    search_fields = ['employee__name']

@admin.register(EditRequest)
class EditRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['employee__name']

@admin.register(LiveLocation)
class LiveLocationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'latitude', 'longitude', 'timestamp']
    list_filter = ['timestamp']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ['employee', 'period_start', 'period_end', 'net_pay', 'status', 'sss_percent', 'philhealth_percent', 'pagibig_percent']
    list_filter = ['period_start', 'period_end', 'status']
    search_fields = ['employee__firstname', 'employee__lastname', 'employee__employee_id']
    # Allow editing percents in the change form; they are persisted on save

@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'document_type', 'uploaded_at']
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['employee__firstname', 'employee__lastname', 'employee__employee_id']
    readonly_fields = ['uploaded_at']

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'status', 'attachment_count']
    list_filter = ['leave_type', 'status', 'start_date', 'end_date']
    search_fields = ['employee__firstname', 'employee__lastname', 'employee__employee_id']
    readonly_fields = ['created_at']
    inlines = []

    def attachment_count(self, obj):
        try:
            return obj.attachments.count()
        except Exception:
            return 0
    attachment_count.short_description = 'Attachments'


class LeaveAttachmentInline(admin.TabularInline):
    model = LeaveAttachment
    extra = 0
    readonly_fields = ['preview', 'uploaded_at']
    fields = ['preview', 'file', 'uploaded_at']

    def preview(self, instance):
        if not instance or not instance.file:
            return '-'
        url = instance.file.url
        if url.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            return mark_safe(f'<a href="{url}" target="_blank"><img src="{url}" style="max-height:80px; max-width:120px; object-fit:cover;"/></a>')
        return mark_safe(f'<a href="{url}" target="_blank">Open</a> | <a href="{url}" download>Download</a>')
    preview.short_description = 'Preview'

# attach the inline to the admin registration
LeaveRequestAdmin.inlines = [LeaveAttachmentInline]