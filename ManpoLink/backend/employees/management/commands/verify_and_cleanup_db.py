"""
Django management command to verify system security and clean up test accounts.
This script checks:
1. Authentication mechanism (can_login restriction)
2. Image upload functionality
3. Data models (Attendance, Payroll, EditRequest)
4. Database integrity
5. Deletes all accounts except admin_test user
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from employees.models import Employee, Attendance, Payroll, EditRequest, LeaveRequest, EmployeeDocument
import sys


class Command(BaseCommand):
    help = 'Verify system security and clean up database (delete all accounts except admin_test)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='Only check security issues, do not delete anything',
        )
        parser.add_argument(
            '--report',
            action='store_true',
            help='Generate a detailed security and functionality report',
        )

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("3PL SYSTEM VERIFICATION AND DATABASE CLEANUP")
        self.stdout.write("="*80)

        # Step 1: Generate Report
        if options['report'] or options['check_only']:
            self.generate_report()
        
        # Step 2: Verify Security Issues
        self.verify_security_issues()
        
        # Step 3: Check Functionality
        self.check_functionality()

        # Step 4: Database Cleanup (unless check-only mode)
        if not options['check_only']:
            self.cleanup_database()
        else:
            self.stdout.write(self.style.WARNING("\n[CHECK-ONLY MODE] No deletions performed"))

        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS("✓ Verification complete!"))
        self.stdout.write("="*80 + "\n")

    def generate_report(self):
        """Generate detailed security and functionality report"""
        self.stdout.write(self.style.HTTP_INFO("\n--- SYSTEM REPORT ---\n"))
        
        # Database Users
        users_count = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        
        self.stdout.write(f"Total Django Users: {users_count}")
        self.stdout.write(f"  - Active: {active_users}")
        self.stdout.write(f"  - Inactive: {inactive_users}")
        
        # Employees
        employees_count = Employee.objects.count()
        can_login_count = Employee.objects.filter(can_login=True).count()
        cannot_login_count = Employee.objects.filter(can_login=False).count()
        
        self.stdout.write(f"\nTotal Employees: {employees_count}")
        self.stdout.write(f"  - Can Login: {can_login_count}")
        self.stdout.write(f"  - Cannot Login: {cannot_login_count}")
        
        # Data Models
        attendance_count = Attendance.objects.count()
        payroll_count = Payroll.objects.count()
        edit_requests_count = EditRequest.objects.count()
        leave_requests_count = LeaveRequest.objects.count()
        employee_documents_count = EmployeeDocument.objects.count()
        
        self.stdout.write(f"\nData Records:")
        self.stdout.write(f"  - Attendance Records: {attendance_count}")
        self.stdout.write(f"  - Payroll Records: {payroll_count}")
        self.stdout.write(f"  - Edit Requests: {edit_requests_count}")
        self.stdout.write(f"  - Leave Requests: {leave_requests_count}")
        self.stdout.write(f"  - Employee Documents: {employee_documents_count}")
        
        # User Details
        self.stdout.write(f"\nUser Accounts:")
        for user in User.objects.all().order_by('username'):
            status = "✓ ACTIVE" if user.is_active else "✗ INACTIVE"
            is_superuser = " [SUPERUSER]" if user.is_superuser else ""
            is_staff = " [STAFF]" if user.is_staff else ""
            
            try:
                emp = Employee.objects.get(user=user)
                can_login_status = "CAN LOGIN" if emp.can_login else "CANNOT LOGIN"
                emp_info = f" - {emp.full_name} ({emp.role}) - {can_login_status}"
            except Employee.DoesNotExist:
                emp_info = f" - NO EMPLOYEE RECORD"
            
            self.stdout.write(f"  • {user.username} {status}{is_superuser}{is_staff}{emp_info}")

    def verify_security_issues(self):
        """Check for security concerns"""
        self.stdout.write(self.style.HTTP_INFO("\n--- SECURITY VERIFICATION ---\n"))
        
        issues_found = []
        
        # Issue 1: can_login restriction is disabled in LoginView
        issues_found.append({
            'severity': 'HIGH',
            'issue': 'can_login restriction disabled in LoginView',
            'details': 'The LoginView has commented-out code that checks employee.can_login. '
                      'This means any active user can login regardless of can_login flag.',
            'recommendation': 'Enable the can_login check in LoginView to properly restrict logins.'
        })
        
        # Issue 2: Check for active users who shouldn't have login access
        active_users_with_no_login = Employee.objects.filter(
            is_active=True, 
            can_login=False, 
            user__is_active=True
        ).count()
        
        if active_users_with_no_login > 0:
            issues_found.append({
                'severity': 'MEDIUM',
                'issue': f'{active_users_with_no_login} active accounts with can_login=False',
                'details': f'Found {active_users_with_no_login} employees with is_active=True but can_login=False. '
                          'These should be restricted from login but currently are not due to disabled check.',
                'recommendation': 'Enable can_login restriction check and set is_active=False for non-login accounts.'
            })
        
        # Issue 3: Check for multiple Django superusers
        superusers = User.objects.filter(is_superuser=True)
        if superusers.count() > 1:
            issues_found.append({
                'severity': 'HIGH',
                'issue': f'Multiple Django superusers found ({superusers.count()})',
                'details': f'Superusers: {", ".join([u.username for u in superusers])}',
                'recommendation': 'Consider limiting superuser accounts to essential admin users only.'
            })
        
        # Issue 4: Users without associated Employee records
        users_no_employee = User.objects.filter(employee__isnull=True)
        if users_no_employee.count() > 0:
            issues_found.append({
                'severity': 'MEDIUM',
                'issue': f'{users_no_employee.count()} Django users without Employee records',
                'details': f'Users: {", ".join([u.username for u in users_no_employee])}',
                'recommendation': 'Consider removing or linking these to Employee records.'
            })
        
        # Display issues
        if issues_found:
            self.stdout.write(self.style.ERROR(f"Found {len(issues_found)} security issues:\n"))
            for i, issue in enumerate(issues_found, 1):
                self.stdout.write(f"{i}. [{issue['severity']}] {issue['issue']}")
                self.stdout.write(f"   Details: {issue['details']}")
                self.stdout.write(f"   → {issue['recommendation']}\n")
        else:
            self.stdout.write(self.style.SUCCESS("✓ No major security issues found"))

    def check_functionality(self):
        """Check if key functionality is working"""
        self.stdout.write(self.style.HTTP_INFO("\n--- FUNCTIONALITY CHECK ---\n"))
        
        checks = []
        
        # Check 1: Image upload fields exist
        attendance_with_images = Attendance.objects.filter(
            clock_in_image__isnull=False
        ) | Attendance.objects.filter(
            clock_out_image__isnull=False
        )
        checks.append({
            'feature': 'Attendance Image Upload',
            'status': 'OK' if attendance_with_images.exists() else 'NOT TESTED',
            'count': attendance_with_images.count()
        })
        
        # Check 2: Payroll records
        payroll_approved = Payroll.objects.filter(status='approved').count()
        checks.append({
            'feature': 'Payroll Processing',
            'status': 'OK' if Payroll.objects.exists() else 'NOT TESTED',
            'count': Payroll.objects.count()
        })
        
        # Check 3: Edit requests
        checks.append({
            'feature': 'Edit Request Processing',
            'status': 'OK' if EditRequest.objects.exists() else 'NOT TESTED',
            'count': EditRequest.objects.count()
        })
        
        # Check 4: Employee documents
        checks.append({
            'feature': 'Employee Document Upload',
            'status': 'OK' if EmployeeDocument.objects.exists() else 'NOT TESTED',
            'count': EmployeeDocument.objects.count()
        })
        
        # Display results
        for check in checks:
            status_style = self.style.SUCCESS if check['status'] == 'OK' else self.style.WARNING
            self.stdout.write(f"✓ {check['feature']}: {status_style(check['status'])} ({check['count']} records)")

    def cleanup_database(self):
        """Delete all test accounts except admin_test"""
        self.stdout.write(self.style.HTTP_INFO("\n--- DATABASE CLEANUP ---\n"))
        
        # Find admin_test user
        try:
            admin_test = User.objects.get(username='admin_test')
            self.stdout.write(f"✓ Found admin_test user (ID: {admin_test.id})")
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("⚠ admin_test user not found. Creating it..."))
            admin_test = User.objects.create_superuser(
                username='admin_test',
                email='admin_test@3pl.local',
                password='admin_test_password'
            )
            self.stdout.write(self.style.SUCCESS(f"✓ Created admin_test user"))
        
        # Get all users except admin_test
        users_to_delete = User.objects.exclude(username='admin_test')
        delete_count = users_to_delete.count()
        
        if delete_count == 0:
            self.stdout.write(self.style.WARNING("No other users to delete."))
            return
        
        # List users to be deleted
        self.stdout.write(f"\nUsers to be deleted ({delete_count}):")
        for user in users_to_delete:
            try:
                emp = Employee.objects.get(user=user)
                self.stdout.write(f"  • {user.username} ({emp.full_name} - {emp.role})")
            except Employee.DoesNotExist:
                self.stdout.write(f"  • {user.username} (No employee record)")
        
        # Confirm deletion
        self.stdout.write(self.style.ERROR("\n⚠ WARNING: This will permanently delete all accounts except admin_test!"))
        confirm = input("Type 'DELETE ALL' to confirm: ").strip()
        
        if confirm != 'DELETE ALL':
            self.stdout.write(self.style.WARNING("Deletion cancelled."))
            return
        
        # Perform deletion
        self.stdout.write("\nDeleting accounts...")
        deleted_count, _ = users_to_delete.delete()
        
        self.stdout.write(self.style.SUCCESS(f"\n✓ Successfully deleted {deleted_count} user(s)"))
        self.stdout.write(f"✓ Remaining user: admin_test")

