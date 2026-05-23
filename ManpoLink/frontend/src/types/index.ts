// ==================== TYPE DEFINITIONS ====================

// Core types for the Employee Management System

export interface Hub {
  id: number;
  name: string;
  location: string;
  city: string;
  company: string;
  address: string;
  latitude: number;
  longitude: number;
  employee_count: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
}

export interface Employee {
  id: number;
  firstname: string;
  lastname: string;
  middle_initial?: string;
  full_name: string;
  
  // Personal Info
  place_of_birth?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  
  // Contact
  email_address?: string;
  email?: string;
  phone_number?: string;
  current_address?: string;
  permanent_address?: string;
  
  // Employment
  position: string;
  employment_type: string;
  status: string;
  role: string;
  hub?: Hub | number;
  hub_name?: string;
  hired_date?: string;
  date_hired?: string;
  jtp_code?: string;
  employee_id: string;
  
  // Emergency
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  
  // Government IDs
  tin?: string;
  sss?: string;
  philhealth?: string;
  pagibig?: string;
  
  // Profile
  profile_image?: string;
  profile_image_url?: string;
  
  // Login/Security
  can_login?: boolean;
  can_edit_info?: boolean;
  is_active?: boolean;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  
  // Relations
  user?: User;
  user_info?: User;
  attendance_history?: Attendance[];
  documents?: EmployeeDocument[];
  [key: string]: any;
}

export interface Attendance {
  id: number;
  employee: number;
  employee_name: string;
  jtp_code: string;
  hub_name: string;
  city: string;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  clock_in_image?: string;
  clock_out_image?: string;
  status: 'present' | 'absent' | 'late' | 'on_leave';
}

export interface Payroll {
  id: number;
  employee: number;
  employee_name: string;
  jtp_code: string;
  hub_name: string;
  pay_period: string;
  basic_salary: number;
  allowances: number;
  overtime_pay: number;
  incentives: number;
  late_deduction: number;
  absent_deduction: number;
  other_deduction: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  deduction_details: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: 'pending' | 'approved' | 'paid';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: number;
  employee: number;
  file: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
}

export interface EditRequest {
  id: number;
  employee: number;
  employee_name: string;
  requested_data: Record<string, any>;
  uploaded_files?: File;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: User;
  notes?: string;
  reviewed_at?: string;
  created_at: string;
  changes_preview?: string;
  image_url?: string;
}

export interface ActivityLog {
  id: number;
  employee?: number;
  employee_name: string;
  role: 'Employee' | 'HR' | 'Admin';
  action: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  formatted_date?: string;
}

export interface SecurityAlert {
  id: number;
  employee?: number;
  employee_name: string;
  alert_type: 'login_attempt' | 'failed_login' | 'suspicious_login' | 'account_locked' | 'account_disabled' | 'multiple_attempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  is_resolved: boolean;
  resolved_by?: User;
  resolved_at?: string;
  created_at: string;
  formatted_date?: string;
}

export interface HRPermission {
  id: number;
  hr_employee: number;
  can_view_employees: boolean;
  can_edit_employee_info: boolean;
  can_edit_payslip: boolean;
  can_delete_employees: boolean;
  can_reset_password: boolean;
  can_enable_employee_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiveLocation {
  id: number;
  employee: number;
  employee_name: string;
  employee_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  distance_from_hub?: number;
}

// API Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  employee: Employee;
  token?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  new_employees_this_month: number;
  employees_by_hub: { hub_name: string; count: number }[];
  employees_by_role: { role: string; count: number }[];
  employees_by_status: { status: string; count: number }[];
}

// Field Types for Dynamic Forms
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'email' | 'textarea' | 'file';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  readonly?: boolean;
}

// Form Field Configuration
export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  value: any;
  options?: { value: string | number; label: string }[];
  required?: boolean;
  placeholder?: string;
  error?: string;
}

// Filter Types
export interface PayrollFilters {
  hub_id?: number;
  employee_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface AttendanceFilters {
  employee_id?: number;
  date_from?: string;
  date_to?: string;
}
