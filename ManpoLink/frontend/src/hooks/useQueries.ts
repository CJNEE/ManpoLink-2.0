import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, employeeAPI, hubAPI, attendanceAPI, payrollAPI, editRequestAPI, leaveRequestAPI, activityLogAPI, securityAlertAPI, documentAPI } from '@/api/apiService';
import { QUERY_KEYS } from '@/constants/api';

// Auth hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return authAPI.login(username, password);
    },
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CURRENT_USER,
    queryFn: () => authAPI.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Employee hooks
export const useGetEmployees = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, params],
    queryFn: () => employeeAPI.getEmployees(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useGetEmployee = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.EMPLOYEE(id),
    queryFn: () => employeeAPI.getEmployee(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => employeeAPI.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
    },
  });
};

export const useUpdateEmployee = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => employeeAPI.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEE(id) });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeAPI.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
    },
  });
};

export const useBulkToggleLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeIds, canLogin }: { employeeIds: number[]; canLogin: boolean }) => 
      employeeAPI.bulkToggleLogin(employeeIds, canLogin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
    },
  });
};

// Hub hooks
export const useGetHubs = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.HUBS, params],
    queryFn: () => hubAPI.getHubs(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetHub = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.HUB(id),
    queryFn: () => hubAPI.getHub(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateHub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => hubAPI.createHub(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HUBS] });
    },
  });
};

export const useDeleteHub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => hubAPI.deleteHub(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HUBS] });
    },
  });
};

export const useUpdateHub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hubAPI.updateHub({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HUBS] });
    },
  });
};

// Attendance hooks
export const useGetAttendance = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, params],
    queryFn: () => attendanceAPI.getAttendance(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useClockIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => attendanceAPI.clockIn(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE });
    },
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => attendanceAPI.clockOut(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE });
    },
  });
};

// Payroll hooks
export const useGetPayroll = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYROLL, params],
    queryFn: () => payrollAPI.getPayroll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdatePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) =>
      payrollAPI.updatePayroll(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYROLL });
    },
  });
};

export const useCreatePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => payrollAPI.createPayroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYROLL });
    },
  });
};

// Leave Request hooks
export const useGetLeaveRequests = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_REQUESTS, params],
    queryFn: () => leaveRequestAPI.getLeaveRequests(params),
    staleTime: 1 * 60 * 1000,
  });
};

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      leaveRequestAPI.approveRequest(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEAVE_REQUESTS });
    },
  });
};

export const useRejectLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      leaveRequestAPI.rejectRequest(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEAVE_REQUESTS });
    },
  });
};

export const useClearAllLeaveRequests = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveRequestAPI.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEAVE_REQUESTS });
    },
  });
};

// Edit Request hooks
export const useGetEditRequests = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.EDIT_REQUESTS, params],
    queryFn: () => editRequestAPI.getEditRequests(params),
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateEditRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => editRequestAPI.createEditRequest(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EDIT_REQUESTS });
    },
  });
};

export const useApproveEditRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => editRequestAPI.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EDIT_REQUESTS });
    },
  });
};

export const useRejectEditRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: number | { id: number; notes?: string }) => {
      if (typeof payload === 'number') return editRequestAPI.rejectRequest(payload);
      return editRequestAPI.rejectRequest(payload.id, { notes: payload.notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EDIT_REQUESTS });
    },
  });
};

export const useClearAllEditRequests = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => editRequestAPI.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EDIT_REQUESTS });
    },
  });
};

// Activity Log hooks
export const useGetActivityLogs = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ACTIVITY_LOGS, params],
    queryFn: () => activityLogAPI.getActivityLogs(params),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time updates
  });
};

export const useClearAllActivityLogs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => activityLogAPI.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACTIVITY_LOGS });
    },
  });
};

// Security Alert hooks
export const useGetSecurityAlerts = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SECURITY_ALERTS, params],
    queryFn: () => securityAlertAPI.getSecurityAlerts(params),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time updates
  });
};

export const useClearAllSecurityAlerts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => securityAlertAPI.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_ALERTS });
    },
  });
};

/* =========================
   DOCUMENT HOOKS
========================= */
export const useGetDocuments = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS, params],
    queryFn: () => documentAPI.getDocuments(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, file, fileName }: { employeeId: number; file: File; fileName: string }) =>
      documentAPI.uploadDocument(employeeId, file, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentAPI.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
    },
    onError: (err: any) => {
      if (err?.response?.status === 404) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
      }
    },
  });
};
