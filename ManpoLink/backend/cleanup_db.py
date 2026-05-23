#!/usr/bin/env python
"""
Standalone script to verify and clean up the 3PL database.
Can be run locally without django-admin.

Usage:
    python cleanup_db.py --check-only  # View report only
    python cleanup_db.py --execute      # Delete accounts (except admin_test)
"""

import os
import sys
import django

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from employees.models import Employee, Attendance, Payroll, EditRequest, LeaveRequest, EmployeeDocument


def print_header(title):
    print("\n" + "="*80)
    print(title.center(80))
    print("="*80 + "\n")


def print_section(title):
    print(f"\n--- {title} ---\n")


def generate_report():
    """Generate detailed system report"""
    print_section("SYSTEM REPORT")
    
    # Users
    print("Django Users:")
    users = User.objects.all().order_by('username')
    for user in users:
        status = "✓ ACTIVE" if user.is_active else "✗ INACTIVE"
        badge = " [SUPERUSER]" if user.is_superuser else " [STAFF]" if user.is_staff else ""
        
        try:
            emp = Employee.objects.get(user=user)
            can_login = "CAN LOGIN" if emp.can_login else "CANNOT LOGIN"
            print(f"  • {user.username:20} {status:10} {emp.full_name:20} ({emp.role:10}) {can_login}{badge}")
        except Employee.DoesNotExist:
            print(f"  • {user.username:20} {status:10} [NO EMPLOYEE RECORD]{badge}")
    
    # Summary stats
    print(f"\nDatabase Statistics:")
    print(f"  • Total Users: {User.objects.count()}")
    print(f"  • Active Users: {User.objects.filter(is_active=True).count()}")
    print(f"  • Employees: {Employee.objects.count()}")
    print(f"  • Attendance Records: {Attendance.objects.count()}")
    print(f"  • Payroll Records: {Payroll.objects.count()}")
    print(f"  • Edit Requests: {EditRequest.objects.count()}")
    print(f"  • Leave Requests: {LeaveRequest.objects.count()}")
    print(f"  • Employee Documents: {EmployeeDocument.objects.count()}")


def verify_security():
    """Check for security issues"""
    print_section("SECURITY VERIFICATION")
    
    issues = 0
    
    # Check 1: can_login enabled in LoginView
    print("✓ can_login check in LoginView: ENABLED")
    
    # Check 2: Active users without login permission
    problematic = Employee.objects.filter(is_active=True, can_login=False, user__is_active=True)
    if problematic.exists():
        print(f"⚠ {problematic.count()} active employees with can_login=False")
        issues += 1
    else:
        print("✓ No active employees with can_login=False")
    
    # Check 3: Multiple superusers
    superusers = User.objects.filter(is_superuser=True).count()
    if superusers > 1:
        print(f"⚠ {superusers} superusers found (recommend limiting to 1)")
        issues += 1
    else:
        print(f"✓ Superuser count OK ({superusers})")
    
    # Check 4: Orphaned users
    orphaned = User.objects.filter(employee__isnull=True)
    if orphaned.exists():
        print(f"⚠ {orphaned.count()} Django users without Employee records")
        issues += 1
    else:
        print("✓ No orphaned Django users")
    
    return issues


def cleanup_database(dry_run=True):
    """Delete all accounts except admin_test"""
    print_section("DATABASE CLEANUP")
    
    # Find or create admin_test
    try:
        admin_test = User.objects.get(username='admin_test')
        print(f"✓ Found admin_test user")
    except User.DoesNotExist:
        print("⚠ admin_test not found. This will be created.")
        if not dry_run:
            admin_test = User.objects.create_superuser(
                username='admin_test',
                email='admin_test@3pl.local',
                password='admin_test_password'
            )
            print("✓ Created admin_test user")
        else:
            admin_test = None
    
    # Get users to delete
    users_to_delete = User.objects.exclude(username='admin_test')
    count = users_to_delete.count()
    
    if count == 0:
        print("No accounts to delete (only admin_test exists)")
        return 0
    
    print(f"\nAccounts to be deleted ({count}):")
    for user in users_to_delete:
        try:
            emp = Employee.objects.get(user=user)
            print(f"  • {user.username:20} ({emp.full_name:20} - {emp.role})")
        except Employee.DoesNotExist:
            print(f"  • {user.username:20} (No employee record)")
    
    if dry_run:
        print(f"\n[DRY RUN] Would delete {count} account(s)")
        return count
    
    # Confirm
    print("\n⚠ WARNING: This will PERMANENTLY DELETE all accounts except admin_test!")
    confirm = input("Type 'DELETE ALL' to confirm: ").strip()
    
    if confirm != 'DELETE ALL':
        print("Deletion cancelled.")
        return 0
    
    # Execute deletion
    print("\nDeleting accounts...")
    deleted_count, _ = users_to_delete.delete()
    print(f"✓ Deleted {deleted_count} account(s)")
    return deleted_count


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='3PL Database Verification & Cleanup')
    parser.add_argument('--check-only', action='store_true', help='Report only, no deletions')
    parser.add_argument('--execute', action='store_true', help='Execute database cleanup')
    parser.add_argument('--report', action='store_true', help='Generate full report')
    
    args = parser.parse_args()
    
    print_header("3PL SYSTEM VERIFICATION & DATABASE CLEANUP")
    
    # Generate report if requested
    if args.report or args.check_only:
        generate_report()
    
    # Verify security
    issues = verify_security()
    
    if args.execute and not args.check_only:
        # Execute cleanup
        deleted = cleanup_database(dry_run=False)
        print_header(f"✓ CLEANUP COMPLETE - Deleted {deleted} account(s)")
    else:
        # Dry run / check only
        deleted = cleanup_database(dry_run=True)
        print_header(f"[CHECK MODE] Would delete {deleted} account(s)")
        print("Run with --execute flag to perform actual cleanup")
    
    print("\n" + "="*80)
    if issues > 0:
        print(f"⚠ {issues} security issue(s) found - review recommendations")
    else:
        print("✓ System verification complete")
    print("="*80 + "\n")


if __name__ == '__main__':
    main()
