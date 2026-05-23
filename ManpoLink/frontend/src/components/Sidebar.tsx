import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/context/ThemeContext';
import {
  LogOut,
  Menu,
  X,
  Home,
  Users,
  MapPin,
  Lock,
  Clock,
  DollarSign,
  FileText,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import logo from '@/images/3pl4.png';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  /** When true, theme toggle is omitted (e.g. Hubs page shows it in the header). */
  hideThemeToggle?: boolean;
}

export const Sidebar = ({ open, onToggle, hideThemeToggle = false }: SidebarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [employeeRequestOpen, setEmployeeRequestOpen] = useState(
    window.location.pathname === '/admin/edit-requests' ||
      window.location.pathname === '/admin/leave-requests' ||
      window.location.pathname === '/hr/edit-requests' ||
      window.location.pathname === '/hr/leave-requests'
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rawRole = (user?.role || '').toString().trim().toLowerCase();

  const normalizedRole =
    rawRole.includes('admin')
      ? 'admin'
      : rawRole.includes('hr')
      ? 'hr'
      : rawRole;

  const navItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path:
        normalizedRole === 'admin'
          ? '/admin'
          : normalizedRole === 'hr'
          ? '/hr'
          : '/employee',
      roles: ['admin', 'hr'],
    },

    {
      label: 'Employees',
      icon: Users,
      path:
        normalizedRole === 'admin'
          ? '/admin/employees'
          : normalizedRole === 'hr'
          ? '/hr/employees'
          : '/employee',
      roles: ['admin', 'hr'],
    },

    // Parent Nav
    {
      label: 'Employee Request',
      icon: FileText,
      roles: ['admin', 'hr'],
      children: [
        {
          label: 'Edit Request',
          path:
            normalizedRole === 'admin'
              ? '/admin/edit-requests'
              : '/hr/edit-requests',
        },
        {
          label: 'Leave Request',
          path:
            normalizedRole === 'admin'
              ? '/admin/leave-requests'
              : '/hr/leave-requests',
        },
      ],
    },

    {
      label: 'Hubs',
      icon: MapPin,
      path:
        normalizedRole === 'admin'
          ? '/admin/hubs'
          : normalizedRole === 'hr'
          ? '/hr/hubs'
          : '/employee',
      roles: ['admin', 'hr'],
    },

    {
      label: 'Access Control',
      icon: Lock,
      path:
        normalizedRole === 'admin'
          ? '/admin/access-control'
          : normalizedRole === 'hr'
          ? '/hr/access-control'
          : '/employee',
      roles: ['admin', 'hr'],
    },

    {
      label: 'Attendance',
      icon: Clock,
      path:
        normalizedRole === 'employee'
          ? '/employee/attendance'
          : normalizedRole === 'hr'
          ? '/hr/attendance'
          : '/admin/attendance',
      roles: ['admin', 'hr'],
    },

    {
      label: 'Payroll',
      icon: DollarSign,
      path:
        normalizedRole === 'admin'
          ? '/admin/payslip'
          : normalizedRole === 'hr'
          ? '/hr/payslip'
          : '/employee',
      roles: ['admin', 'hr'],
    },

    {
      label: 'Activity Logs',
      icon: Activity,
      path:
        normalizedRole === 'admin'
          ? '/admin/activity-logs'
          : normalizedRole === 'hr'
          ? '/hr/activity-logs'
          : '/employee',
      roles: ['admin', 'hr'],
    },

    {
      label: 'Security Alerts',
      icon: AlertTriangle,
      path:
        normalizedRole === 'admin'
          ? '/admin/security-alerts'
          : normalizedRole === 'hr'
          ? '/hr/security-alerts'
          : '/employee',
      roles: ['admin', 'hr'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(normalizedRole)
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={onToggle}
          className="p-2 bg-[#8B0000] text-white rounded-lg shadow-md hover:bg-[#6B0000] transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-100 dark:border-gray-700 transform transition-transform duration-300 z-40 ${
          open
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div>
            <img
              src={logo}
              alt="3PL Logo"
              className="h-36 w-auto object-contain mb-1 mx-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item: any, index) => {
              const Icon = item.icon;

              // SUBMENU ITEM
              if (item.children) {
                return (
                  <div key={index}>
                    <button
                      onClick={() =>
                        setEmployeeRequestOpen(!employeeRequestOpen)
                      }
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </div>

                      {employeeRequestOpen ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </button>

                    {/* Subnav */}
                    {employeeRequestOpen && (
                      <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3 z-50 transition-all duration-200">
                        {item.children.map((child: any) => {
                          const isChildActive =
                            window.location.pathname === child.path;

                          return (
                            <button
                              key={child.path}
onClick={() => {
                                navigate(child.path);
                                // keep submenu open for edit/leave requests
                              }}
                              className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                                isChildActive
                                  ? 'bg-[#8B0000] text-white shadow-md'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // NORMAL NAV ITEM
              const isActive = window.location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onToggle();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-[#8B0000] text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section — theme toggle beside avatar */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#8B0000] text-white flex items-center justify-center font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              {!hideThemeToggle && <ThemeToggle />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;