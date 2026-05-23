const devFallback = 'http://localhost:8000/api';

/** Default backend when `VITE_API_URL` is unset. Same host as `vercel.json` rewrites. */
const DEFAULT_PRODUCTION_API =
  'https://threepl-backend-wf79.onrender.com/api';

function looksLikeLocalBackend(url: string): boolean {
  const t = url.trim();
  try {
    const proto = /^https?:\/\//i.test(t) ? '' : 'http://';
    const u = new URL(proto + t.replace(/^\/\//, ''));
    const h = u.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(t);
  }
}

/** If VITE_API_URL is only scheme+host (e.g. Render root), normalize to `/api`. */
function normalizeEnvApiBase(raw: string): string {
  const trimmed = raw.replace(/\/$/, '');
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/$/, '') || '/';
    if (path === '/') {
      u.pathname = '/api';
      return `${u.origin}/api`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Production: calls Render backend directly (CORS allows *.vercel.app). 
 * Frontend on Vercel connects directly to Render backend.
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  const prod = !!import.meta.env.PROD;

  if (prod) {
    // In production, always use the backend directly with CORS
    return 'https://threepl-backend-wf79.onrender.com/api';
  }

  if (raw) {
    return normalizeEnvApiBase(raw);
  }

  return devFallback;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Build an absolute `/api/...` or full URL without duplicating slashes. */
export function apiUrl(pathRelativeToApiRoot: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const rest =
    pathRelativeToApiRoot.startsWith('/') ? pathRelativeToApiRoot.slice(1) : pathRelativeToApiRoot;
  return `${base}/${rest}`;
}

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login/',
  LOGOUT: '/logout/',
  CURRENT_USER: '/current-user/',
  
  // Employees
  EMPLOYEES: '/employees/',
  EMPLOYEE_DETAIL: (id: number) => `/employees/${id}/`,
  EMPLOYEE_DOCUMENTS: (id: number) => `/employees/${id}/documents/`,
  
  // Hubs
  HUBS: '/hubs/',
  HUB_DETAIL: (id: number) => `/hubs/${id}/`,
  
  // Attendance
  ATTENDANCE: '/attendance/',
  ATTENDANCE_CLOCK_IN: '/attendance/clock_in/',
  ATTENDANCE_CLOCK_OUT: '/attendance/clock_out/',
  ATTENDANCE_DETAIL: (id: number) => `/attendance/${id}/`,
  
  // Payroll
  PAYROLL: '/payroll/',
  PAYROLL_DETAIL: (id: number) => `/payroll/${id}/`,
  PAYROLL_DOWNLOAD_CSV: (hubId: number) => `/payroll/download/${hubId}/`,
  
  // Edit Requests
  EDIT_REQUESTS: '/edit-requests/',
  EDIT_REQUEST_DETAIL: (id: number) => `/edit-requests/${id}/`,
  EDIT_REQUEST_APPROVE: (id: number) => `/edit-requests/${id}/approve/`,
  EDIT_REQUEST_REJECT: (id: number) => `/edit-requests/${id}/reject/`,
  
  // Live Locations
  LIVE_LOCATIONS: '/live-locations/',
  
  // Stats
  STATS: '/stats/',
  META: '/meta/',
  
  // Activity Logs
  ACTIVITY_LOGS: '/activity-logs/',
  
  // Security Alerts
  SECURITY_ALERTS: '/security-alerts/',
  
  // Employee Documents
  EMPLOYEE_DOCUMENTS_LIST: '/employee-documents/',
  EMPLOYEE_DOCUMENT_DETAIL: (id: number) => `/employee-documents/${id}/`,
  
  // Security
  LOCK_UNLOCK_ACCOUNT: (employeeId: number) => `/lock-unlock-account/${employeeId}/`,
  RESET_PASSWORD: (employeeId: number) => `/reset-password/${employeeId}/`,

  // Leave Requests
  LEAVE_REQUESTS: '/leave-requests/',
} as const;

export const QUERY_KEYS = {
  EMPLOYEES: ['employees'],
  EMPLOYEE: (id: number) => ['employees', id],
  HUBS: ['hubs'],
  HUB: (id: number) => ['hubs', id],
  ATTENDANCE: ['attendance'],
  PAYROLL: ['payroll'],
  EDIT_REQUESTS: ['edit-requests'],
  LIVE_LOCATIONS: ['live-locations'],
  STATS: ['stats'],
  ACTIVITY_LOGS: ['activity-logs'],
  SECURITY_ALERTS: ['security-alerts'],
  CURRENT_USER: ['current-user'],
  DOCUMENTS: ['documents'],
  DOCUMENT: (id: number) => ['documents', id],
  LEAVE_REQUESTS: ['leave-requests'],
} as const;
