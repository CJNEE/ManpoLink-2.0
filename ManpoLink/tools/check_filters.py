import requests

BASE = 'http://127.0.0.1:8000/api'

creds = {
    'hr': ('hr_test', 'TestPass123'),
    'admin': ('admin_test', 'AdminPass123')
}

def get_token(username, password):
    r = requests.post(f'{BASE}/login/', json={'username': username, 'password': password})
    r.raise_for_status()
    return r.json().get('token')


def get_json(path, token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{BASE}/{path}', headers=headers)
    r.raise_for_status()
    return r.json()


def summarize():
    tokens = {}
    for k, (u, p) in creds.items():
        tokens[k] = get_token(u, p)

    print('Tokens acquired')

    # Employees
    hr_emps = get_json('employees/', tokens['hr'])
    admin_emps = get_json('employees/', tokens['admin'])

    print('Employees visible: HR=', len(hr_emps), ' Admin=', len(admin_emps))

    admin_ids = {e.get('employee_id') for e in admin_emps}
    print('Admin employee IDs in admin view sample:', list(admin_ids)[:5])

    # Check if any admin-role appears in HR list
    hr_roles = {e.get('role') for e in hr_emps}
    print('HR sees roles sample:', list(hr_roles)[:10])

    # Activity logs
    hr_logs = get_json('activity-logs/', tokens['hr'])
    admin_logs = get_json('activity-logs/', tokens['admin'])
    print('Activity logs count: HR=', len(hr_logs), ' Admin=', len(admin_logs))

    # Security alerts
    hr_alerts = get_json('security-alerts/', tokens['hr'])
    admin_alerts = get_json('security-alerts/', tokens['admin'])
    print('Security alerts count: HR=', len(hr_alerts), ' Admin=', len(admin_alerts))

    # Check for admin-role presence in HR logs
    admin_in_hr_logs = any(l.get('role','').lower()=='admin' for l in hr_logs)
    print('Admin entries present in HR activity logs?', admin_in_hr_logs)

    # Determine admin employee IDs from admin view (role == 'Admin')
    admin_emp_ids = [str(e.get('id')) for e in admin_emps if str(e.get('role','')).lower() == 'admin']
    # Check if any HR-visible alerts reference those admin employee IDs
    admin_in_hr_alerts = any(a.get('employee') and str(a.get('employee')) in admin_emp_ids for a in hr_alerts)
    print('Admin alerts present in HR security alerts?', admin_in_hr_alerts)

    # Show any HR-visible alerts that reference Admin employee id(s)
    hr_visible_admin_alerts = [a for a in hr_alerts if a.get('employee') and str(a.get('employee')) in admin_emp_ids]
    print('HR-visible alerts that reference Admin employee IDs:', [a.get('id') for a in hr_visible_admin_alerts])

if __name__ == '__main__':
    summarize()
