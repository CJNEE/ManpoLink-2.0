import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiService';
import { API_ENDPOINTS, QUERY_KEYS } from '@/constants/api';

type RoleType = string;
type EmploymentType = string;
type StatusType = string;
type GenderType = string;
type MaritalStatusType = string;

type HubOption = {
  id: number;
  name: string;
};

interface AddEmployeeProps {
  onCancel?: () => void;
  onClose?: () => void;
  onCreated?: () => void;
}

interface EmployeeFormState {
  username: string;
  jtpCode: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: GenderType;
  nationality: string;
  maritalStatus: MaritalStatusType;
  email: string;
  phone: string;
  currentAddress: string;
  permanentAddress: string;
  position: string;
  employmentType: EmploymentType;
  status: StatusType;
  role: RoleType;
  hub: string;
  hireDate: string;
  employeeId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  tin: string;
  sss: string;
  philHealth: string;
  pagIbig: string;
  password: string;
  confirmPassword: string;
  canLogin: boolean;
  isActive: boolean;
  createdAt: string;
}

const initialFormState: EmployeeFormState = {
  username: '',
  jtpCode: '',
  firstName: '',
  middleInitial: '',
  lastName: '',
  placeOfBirth: '',
  dateOfBirth: '',
  gender: 'Male',
  nationality: '',
  maritalStatus: 'Single',
  email: '',
  phone: '',
  currentAddress: '',
  permanentAddress: '',
  position: '',
  employmentType: 'Full Time',
  status: 'Active',
  role: 'Employee',
  hub: '',
  hireDate: '',
  employeeId: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  tin: '',
  sss: '',
  philHealth: '',
  pagIbig: '',
  password: '',
  confirmPassword: '',
  canLogin: true,
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const AddEmployee = ({ onCancel, onClose, onCreated }: AddEmployeeProps) => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<EmployeeFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const steps = ['Account', 'Personal', 'Employment'];
  const isLastStep = step === steps.length - 1;

  const goNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const isStepValid = (currentStep: number) => {
    if (currentStep === 0) {
      return (
        Boolean(formState.password) &&
        Boolean(formState.confirmPassword) &&
        formState.password === formState.confirmPassword
      );
    }
    if (currentStep === 1) {
      return Boolean(formState.firstName && formState.lastName && formState.email);
    }
    if (currentStep === 2) {
      return Boolean(formState.position);
    }
    return true;
  };

  const canProceed = !loading && isStepValid(step);

  // dynamic options fetched from backend (falls back to defaults)
  const [roles, setRoles] = useState<string[]>(['Employee', 'HR', 'Admin']);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(['Full-time', 'Full Time', 'Part Time', 'Contract', 'Intern', 'OCW']);
  const [statuses, setStatuses] = useState<string[]>(['Active', 'Resign', 'AWOL', 'Blacklist']);
  const [genders, setGenders] = useState<string[]>(['Male', 'Female', 'Other']);
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>(['Single', 'Married', 'Divorced', 'Widowed']);
  const [positions, setPositions] = useState<string[]>([]);
  const [hubs, setHubs] = useState<HubOption[]>([]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.META}`);
        const json = response.data;

        if (Array.isArray(json.roles)) setRoles(json.roles);
        if (Array.isArray(json.positions)) setPositions(json.positions);
        if (Array.isArray(json.hubs)) setHubs(json.hubs);
        if (Array.isArray(json.statuses)) setStatuses(json.statuses);
        if (Array.isArray(json.employmentTypes)) setEmploymentTypes(json.employmentTypes);
      } catch {
        // ignore, keep defaults
      }
    };

    loadMeta();
  }, []);

  const callClose = () => {
    onClose?.();
    onCancel?.();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    if (type === 'checkbox') {
      setFormState((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLastStep) {
      if (!isStepValid(step)) {
        setError('Please complete the required fields for this step before continuing.');
        return;
      }
      goNext();
      return;
    }

    // basic validation only on final submission
    if (!formState.firstName || !formState.lastName || !formState.email || !formState.password || !formState.position) {
      setError('Please complete required fields (name, email, password, position).');
      return;
    }
    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const fieldMap: Record<string, string | null> = {
        firstName: 'firstname',
        lastName: 'lastname',
        middleInitial: 'middle_initial',
        placeOfBirth: 'place_of_birth',
        dateOfBirth: 'date_of_birth',
        maritalStatus: 'marital_status',
        email: 'email_address',
        phone: 'phone_number',
        currentAddress: 'current_address',
        permanentAddress: 'permanent_address',
        employmentType: 'employment_type',
        hireDate: 'hired_date',
        jtpCode: 'jtp_code',
        employeeId: 'employee_id',
        emergencyContactName: 'emergency_contact_name',
        emergencyContactPhone: 'emergency_contact_phone',
        isActive: 'is_active',
      };

      const normalizeEmploymentType = (value: string) => {
        if (value === 'Full Time') return 'Full-time';
        if (value === 'Part Time' || value === 'Contract' || value === 'Intern') return value;
        return value;
      };

      Object.entries(formState).forEach(([key, val]) => {
        if (key === 'confirmPassword' || key === 'createdAt') return;

        const backendKey = fieldMap[key] ?? key;
        let value = val;

        if (backendKey === 'employment_type' && typeof value === 'string') {
          value = normalizeEmploymentType(value);
        }

        if (typeof value === 'boolean') {
          formData.append(backendKey, String(value));
          return;
        }

        if (value === undefined || value === null || value === '') {
          return;
        }

        formData.append(backendKey, String(value));
      });

      // POST to backend - endpoint expected: /api/employees
      await apiClient.post(API_ENDPOINTS.EMPLOYEES, formData);

      setSuccess('Employee created.');
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
      setFormState({ ...initialFormState, createdAt: new Date().toISOString() });
      onCreated?.();
      setTimeout(callClose, 600);
    } catch (err) {
      const axiosError = err as any;
      const errorData = axiosError?.response?.data;
      const message =
        typeof errorData === 'string'
          ? errorData
          : errorData?.detail ||
            errorData?.message ||
            JSON.stringify(errorData, null, 2) ||
            axiosError?.message ||
            'Server error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl rounded-3xl bg-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:bg-slate-950 dark:shadow-none">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Add Employee</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">A cleaner multi-step flow for account, personal, and work information.</p>
          </div>
          <button
            type="button"
            onClick={callClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`rounded-2xl border px-4 py-3 text-center transition ${index === step ? 'border-blue-500 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Step {index + 1}</div>
              <div className="mt-2 text-sm font-semibold">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">{error}</div>}
      {success && <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Account creation</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Set user access, login details, and core account info.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Required</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Username</span>
                <input
                  name="username"
                  value={formState.username}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</span>
                <input
                  type="password"
                  name="password"
                  value={formState.password}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formState.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Role</span>
                <select
                  name="role"
                  value={formState.role}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>

              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Account status</span>
                <label className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span>Can login</span>
                  <input type="checkbox" name="canLogin" checked={formState.canLogin} onChange={handleChange} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </label>
                <label className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span>Active employee</span>
                  <input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleChange} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </label>
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Personal & contact information</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Capture names, birth details, contact fields, and addresses.</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">First name</span>
                <input
                  name="firstName"
                  value={formState.firstName}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Last name</span>
                <input
                  name="lastName"
                  value={formState.lastName}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Middle initial</span>
                <input
                  name="middleInitial"
                  value={formState.middleInitial}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Place of birth</span>
                <input
                  name="placeOfBirth"
                  value={formState.placeOfBirth}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date of birth</span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formState.dateOfBirth}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Gender</span>
                <select
                  name="gender"
                  value={formState.gender}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone</span>
                <input
                  name="phone"
                  value={formState.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Current address</span>
                <textarea
                  name="currentAddress"
                  value={formState.currentAddress}
                  onChange={handleChange}
                  className="mt-2 h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Permanent address</span>
                <textarea
                  name="permanentAddress"
                  value={formState.permanentAddress}
                  onChange={handleChange}
                  className="mt-2 h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Emergency contact name</span>
                <input
                  name="emergencyContactName"
                  value={formState.emergencyContactName}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Emergency contact phone</span>
                <input
                  name="emergencyContactPhone"
                  value={formState.emergencyContactPhone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Employment & compliance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Assign position, hub, IDs, and payroll details.</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Position</span>
                <select
                  name="position"
                  value={formState.position}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  <option value="">Select position</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Employment type</span>
                <select
                  name="employmentType"
                  value={formState.employmentType}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  {employmentTypes.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</span>
                <select
                  name="status"
                  value={formState.status}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Hub</span>
                <select
                  name="hub"
                  value={formState.hub}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  <option value="">Select hub</option>
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Hired date</span>
                <input
                  type="date"
                  name="hireDate"
                  value={formState.hireDate}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Employee ID</span>
                <input
                  name="employeeId"
                  value={formState.employeeId}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">JTP code</span>
                <input
                  name="jtpCode"
                  value={formState.jtpCode}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">TIN</span>
                <input
                  name="tin"
                  value={formState.tin}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">SSS</span>
                <input
                  name="sss"
                  value={formState.sss}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">PhilHealth</span>
                <input
                  name="philHealth"
                  value={formState.philHealth}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Pag-IBIG</span>
                <input
                  name="pagIbig"
                  value={formState.pagIbig}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
              </label>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Step {step + 1} of {steps.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{step === 0 ? 'Start with account credentials.' : step === 1 ? 'Add contact, identity and address details.' : 'Finish work and payroll details.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={!canProceed}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLastStep ? (loading ? 'Creating...' : 'Create Employee') : 'Next'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};