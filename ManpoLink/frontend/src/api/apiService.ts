import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

// ? Create axios instance (NOW EXPORTED PROPERLY)
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ? Request interceptor (attach token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    // Check if this is a login request
    const reqUrl = String(config.url ?? '');
    const isLoginCall = /\/login\/?$/i.test(reqUrl) || reqUrl.includes('/login/');

    if (token && !isLoginCall) {
      (config.headers as any) = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // If sending FormData, remove any explicit Content-Type so the browser/axios
    // can set the correct multipart boundary automatically.
    if (config.data instanceof FormData) {
      (config.headers as any) = config.headers || {};
      if ((config.headers as any)['Content-Type']) {
        delete (config.headers as any)['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ? Response interceptor (handle auth errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const reqUrl = String(error.config?.url ?? '');
    const isLoginCall = /\/login\/?$/i.test(reqUrl) || reqUrl.includes('/login/');
    
    if (error.response?.status === 401 && !isLoginCall) {
      // Clear auth data on 401 response
      localStorage.removeItem('access_token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentEmployee');
      localStorage.removeItem('auth-store');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

/* =========================
   AUTH API
========================= */
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
      username,
      password,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get(API_ENDPOINTS.CURRENT_USER);
    return response.data;
  },

  logout: async () => {
    await apiClient.post(API_ENDPOINTS.LOGOUT);
  },
};

/* =========================
   EMPLOYEE API
========================= */
export const employeeAPI = {
  getEmployees: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.EMPLOYEES, { params });
    return response.data;
  },

  getEmployee: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE_DETAIL(id));
    return response.data;
  },

  createEmployee: async (data: any) => {
    const response = await apiClient.post(API_ENDPOINTS.EMPLOYEES, data);
    return response.data;
  },

  updateEmployee: async (id: number, data: any) => {
    const response = await apiClient.patch(API_ENDPOINTS.EMPLOYEE_DETAIL(id), data);
    return response.data;
  },

  deleteEmployee: async (id: number) => {
    const response = await apiClient.delete(API_ENDPOINTS.EMPLOYEE_DETAIL(id));
    return response.data;
  },

  bulkToggleLogin: async (employeeIds: number[], canLogin: boolean) => {
    const response = await apiClient.post(
      `${API_ENDPOINTS.EMPLOYEES}bulk_toggle_login/`,
      {
        employee_ids: employeeIds,
        can_login: canLogin,
      }
    );
    return response.data;
  },
};

/* =========================
   HUB API
========================= */
export const hubAPI = {
  getHubs: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.HUBS, { params });
    return response.data;
  },

  getHub: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.HUB_DETAIL(id));
    return response.data;
  },

  createHub: async (data: any) => {
    const response = await apiClient.post(API_ENDPOINTS.HUBS, data);
    return response.data;
  },

  deleteHub: async (id: number) => {
    const response = await apiClient.delete(API_ENDPOINTS.HUB_DETAIL(id));
    return response.data;
  },

  updateHub: async ({ id, data }: { id: number; data: any }) => {
    const response = await apiClient.patch(API_ENDPOINTS.HUB_DETAIL(id), data);
    return response.data;
  },
};

/* =========================
   ATTENDANCE API
========================= */
export const attendanceAPI = {
  getAttendance: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.ATTENDANCE, { params });
    return response.data;
  },

  getAttendanceRecord: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.ATTENDANCE_DETAIL(id));
    return response.data;
  },

  clockIn: async (data: FormData) => {
    const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE_CLOCK_IN, data);
    return response.data;
  },

  clockOut: async (data: FormData) => {
    const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE_CLOCK_OUT, data);
    return response.data;
  },
};

/* =========================
   PAYROLL API
========================= */
export const payrollAPI = {
  getPayroll: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.PAYROLL, { params });
    return response.data;
  },

  getPayrollRecord: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.PAYROLL_DETAIL(id));
    return response.data;
  },

  updatePayroll: async (id: number, data: Record<string, any>) => {
    const response = await apiClient.patch(API_ENDPOINTS.PAYROLL_DETAIL(id), data);
    return response.data;
  },

  createPayroll: async (data: Record<string, any>) => {
    const response = await apiClient.post(API_ENDPOINTS.PAYROLL, data);
    return response.data;
  },

  downloadHubPayrollCSV: async (hubId: number) => {
    const response = await apiClient.get(API_ENDPOINTS.PAYROLL_DOWNLOAD_CSV(hubId), {
      responseType: 'blob',
    });
    return response.data;
  },
};

/* =========================
   LEAVE REQUEST API
========================= */
export const leaveRequestAPI = {
  getLeaveRequests: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.LEAVE_REQUESTS, { params });
    return response.data;
  },
  approveRequest: async (id: number, data?: any) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.LEAVE_REQUESTS}${id}/approve/`, data || {});
    return response.data;
  },
  rejectRequest: async (id: number, data?: any) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.LEAVE_REQUESTS}${id}/reject/`, data || {});
    return response.data;
  },
  clearAll: async () => {
    const response = await apiClient.delete(`${API_ENDPOINTS.LEAVE_REQUESTS}clear_all/`);
    return response.data;
  },
};

/* =========================
   EDIT REQUEST API
========================= */
export const editRequestAPI = {
  getEditRequests: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.EDIT_REQUESTS, { params });
    return response.data;
  },

  getEditRequest: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.EDIT_REQUEST_DETAIL(id));
    return response.data;
  },

  approveRequest: async (id: number) => {
    const response = await apiClient.patch(API_ENDPOINTS.EDIT_REQUEST_APPROVE(id));
    return response.data;
  },

  rejectRequest: async (id: number, data?: Record<string, any>) => {
    const response = await apiClient.patch(API_ENDPOINTS.EDIT_REQUEST_REJECT(id), data || {});
    return response.data;
  },
  
  createEditRequest: async (formData: FormData) => {
    const response = await apiClient.post(API_ENDPOINTS.EDIT_REQUESTS, formData);
    return response.data;
  },

  clearAll: async () => {
    const response = await apiClient.delete(`${API_ENDPOINTS.EDIT_REQUESTS}clear_all/`);
    return response.data;
  },
};

/* =========================
   LIVE LOCATION API
========================= */
export const liveLocationAPI = {
  getLiveLocations: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.LIVE_LOCATIONS, { params });
    return response.data;
  },
};

/* =========================
   STATS API
========================= */
export const statsAPI = {
  getStats: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.STATS, { params });
    return response.data;
  },
};

/* =========================
   ACTIVITY LOG API
========================= */
export const activityLogAPI = {
  getActivityLogs: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.ACTIVITY_LOGS, { params });
    return response.data;
  },

  clearAll: async () => {
    const response = await apiClient.delete(`${API_ENDPOINTS.ACTIVITY_LOGS}clear_all/`);
    return response.data;
  },
};

/* =========================
   SECURITY ALERT API
========================= */
export const securityAlertAPI = {
  getSecurityAlerts: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.SECURITY_ALERTS, { params });
    return response.data;
  },

  clearAll: async () => {
    const response = await apiClient.delete(`${API_ENDPOINTS.SECURITY_ALERTS}clear_all/`);
    return response.data;
  },
};

/* =========================
   EMPLOYEE DOCUMENT API
========================= */
export const documentAPI = {
  getDocuments: async (params?: Record<string, any>) => {
    const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE_DOCUMENTS_LIST, { params });
    return response.data;
  },

  getDocument: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE_DOCUMENT_DETAIL(id));
    return response.data;
  },

  uploadDocument: async (employeeId: number, file: File, fileName: string) => {
    const formData = new FormData();
    formData.append('employee', employeeId.toString());
    formData.append('file', file);
    formData.append('file_name', fileName);
    
    const response = await apiClient.post(API_ENDPOINTS.EMPLOYEE_DOCUMENTS_LIST, formData);
    return response.data;
  },

  deleteDocument: async (id: number) => {
    const response = await apiClient.delete(API_ENDPOINTS.EMPLOYEE_DOCUMENT_DETAIL(id));
    return response.data;
  },
};

/* =========================
   ACCOUNT MANAGEMENT API
========================= */
export const accountAPI = {
  lockUnlockAccount: async (employeeId: number, action: 'lock' | 'unlock') => {
    const response = await apiClient.patch(
      API_ENDPOINTS.LOCK_UNLOCK_ACCOUNT(employeeId),
      { action }
    );
    return response.data;
  },

  resetPassword: async (employeeId: number) => {
    const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD(employeeId));
    return response.data;
  },
};

// ? ALSO KEEP DEFAULT EXPORT
export default apiClient;
