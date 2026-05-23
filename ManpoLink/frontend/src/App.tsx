import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';



// Pages
import { LoginScreen } from '@/pages/auth/LoginScreen';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminEmployeesPage } from '@/pages/admin/AdminEmployeesPage';
import { AdminHubsPage } from '@/pages/admin/AdminHubsPage';
import { AccessControlPage } from '@/pages/admin/AccessControlPage';
import { AttendancePage } from '@/pages/admin/AttendancePage';
import { PayslipPage } from '@/pages/admin/PayslipPage';
import { ActivityLogsPage } from '@/pages/admin/ActivityLogsPage';
import { SecurityAlertsPage } from '@/pages/admin/SecurityAlertsPage';
import HrDashboardPage from '@/pages/hr/HrDashboardPage';
import HrEmployeesPage from '@/pages/hr/HrEmployeesPage';
import HrEmployeeRequestPage from '@/pages/hr/HrEmployeeRequestPage';
import HrEditRequestPage from '@/pages/hr/HrEditRequestPage';
import HrLeaveRequestPage from '@/pages/hr/HrLeaveRequestPage';
import HrHubsPage from '@/pages/hr/HrHubsPage';
import HrAccessControlPage from '@/pages/hr/HrAccessControlPage';
import HrAttendancePage from '@/pages/hr/HrAttendancePage';
import HrPayslipPage from '@/pages/hr/HrPayslipPage';
import HrActivityLogsPage from '@/pages/hr/HrActivityLogsPage';
import HrSecurityAlertsPage from '@/pages/hr/HrSecurityAlertsPage';
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard';
import { AttendanceHistoryScreen } from '@/pages/employee/AttendanceHistoryScreen';
import { EmployeeProfileDetailPage } from '@/pages/employee/EmployeeProfileDetailPage';
import { EditRequestsPanel } from '@/components/EditRequestsManagementPanel';
import { LeaveRequestsPanel } from '@/components/LeaveRequestsPanel';
import { EmployeeLeaveRequestForm } from '@/components/EmployeeLeaveRequestForm';

// Components
import { Layout } from '@/components/common';
import { ThemeProvider } from '@/context/ThemeContext';

// Styles
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, employee } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get role from user object first, then fall back to employee object
  const userRole = user?.role || employee?.role;

  if (requiredRole && userRole && !requiredRole.includes(userRole)) {
    // Redirect to appropriate dashboard based on actual role
    if (userRole === 'Admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'HR') {
      return <Navigate to="/hr" replace />;
    } else if (userRole === 'Employee') {
      return <Navigate to="/employee" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return <Layout>{children}</Layout>;
};


function AuthenticatedHomeRedirect() {
  const { user, employee } = useAuth();
  if (!user && !employee) return <Navigate to="/login" replace />;
  
  // Get role from user object first, then fall back to employee object
  const userRole = user?.role || employee?.role;
  
  if (userRole === 'HR') return <Navigate to="/hr" replace />;
  if (userRole === 'Employee') return <Navigate to="/employee" replace />;
  return <Navigate to="/admin" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={<LoginScreen />}
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole={['Admin']}>
            <DashboardLayout>
              <Routes>
                <Route path="" element={<AdminDashboard />} />
                <Route path="employees" element={<AdminEmployeesPage />} />
                <Route path="employees/:id" element={<EmployeeProfileDetailPage />} />
                <Route path="hubs" element={<AdminHubsPage />} />
                <Route path="access-control" element={<AccessControlPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="payslip" element={<PayslipPage />} />
                <Route path="edit-requests" element={<EditRequestsPanel />} />
                <Route path="leave-requests" element={<LeaveRequestsPanel />} />
                <Route path="activity-logs" element={<ActivityLogsPage />} />
                <Route path="security-alerts" element={<SecurityAlertsPage />} />
              </Routes>
              </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* HR Routes */}
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute requiredRole={['HR']}>
            <DashboardLayout>
              <Routes>
                <Route path="" element={<HrDashboardPage />} />
                <Route path="edit-requests" element={<HrEmployeeRequestPage />} />
                <Route path="employees" element={<HrEmployeesPage />} />
                <Route path="employees/:id" element={<EmployeeProfileDetailPage />} />
                <Route path="hubs" element={<HrHubsPage />} />
                <Route path="access-control" element={<HrAccessControlPage />} />
                <Route path="attendance" element={<HrAttendancePage />} />
                <Route path="payslip" element={<HrPayslipPage />} />
                <Route path="leave-requests" element={<HrLeaveRequestPage />} />
                <Route path="activity-logs" element={<HrActivityLogsPage />} />
                <Route path="security-alerts" element={<HrSecurityAlertsPage />} />
                <Route path="edit-requests/:id" element={<HrEditRequestPage />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute requiredRole={['Employee']}>
            <DashboardLayout>
              <Routes>
                <Route path="" element={<EmployeeDashboard />} />
                <Route path="attendance" element={<AttendanceHistoryScreen />} />
                <Route path="leave-requests" element={<EmployeeLeaveRequestForm />} />
                <Route path="profile/:id" element={<EmployeeProfileDetailPage />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default route */}
      <Route
        path="/"
        element={isAuthenticated ? <AuthenticatedHomeRedirect /> : <Navigate to="/login" replace />}
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
          {/* Toast Notifications */}
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
