import { useAuthStore } from '@/context/authStore';
import { useEffect } from 'react';

export const useAuth = () => {
  const store = useAuthStore();
  
  // Initialize from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const currentUser = localStorage.getItem('currentUser');
    const currentEmployee = localStorage.getItem('currentEmployee');
    
    if (token) {
      store.setToken(token);
      store.setIsAuthenticated(true);
      
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          store.setUser(user);
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
        }
      }
      
      if (currentEmployee) {
        try {
          const employee = JSON.parse(currentEmployee);
          store.setEmployee(employee);
        } catch (e) {
          console.error('Failed to parse employee from localStorage:', e);
        }
      }
    }
  }, []);
  
  const isHR = store.employee?.role?.toLowerCase() === 'hr';
  const isAdmin = store.employee?.role?.toLowerCase() === 'admin' || store.user?.role?.toLowerCase() === 'admin';
  const permissions = store.employee?.hr_permissions || {};

  return {
    user: store.user,
    employee: store.employee,
    token: store.token || localStorage.getItem('access_token'),
    isAuthenticated: store.isAuthenticated,
    isAdmin,
    isHR,
    
    // Permission Helpers
    canViewEmployees: isAdmin || (isHR && permissions.can_view_employees),
    canEditEmployeeInfo: isAdmin || (isHR && permissions.can_edit_employee_info),
    canEditPayroll: isAdmin || (isHR && permissions.can_edit_payslip),
    canDeleteEmployees: isAdmin || (isHR && permissions.can_delete_employees),
    canResetPassword: isAdmin || (isHR && permissions.can_reset_password),

    setUser: store.setUser,
    setEmployee: store.setEmployee,
    setToken: store.setToken,
    setIsAuthenticated: store.setIsAuthenticated,
    logout: store.logout,
  };
};

export const useIsDarkMode = () => {
  const isDarkMode = useAuthStore((state) => state.isDarkMode);
  const toggleDarkMode = useAuthStore((state) => state.toggleDarkMode);
  
  return { isDarkMode, toggleDarkMode };
};
