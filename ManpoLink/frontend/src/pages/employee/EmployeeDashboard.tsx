import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { useGetPayroll } from '@/hooks/useQueries';

import { EmployeeSidebar } from '@/components/EmployeeSidebar';
import { InfoCard, InfoItem } from '@/components/InfoCard';
import { DocumentsSection } from '@/components/DocumentsSection';
import { EmployeeEditModal } from '@/components/EmployeeEditModal';
import { PayslipDetailModal } from '@/components/PayslipViewforemployee';
import { EmployeeLeaveRequestForm } from '@/components/EmployeeLeaveRequestForm';
import { EmployeeLeaveHistoryModal } from '@/components/EmployeeLeaveHistoryModal';
import { Modal } from '@/components/Modal';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { authAPI } from '@/api/apiService';

import {
  LayoutDashboard,
  Clock3,
  Wallet,
  FileText,
  User,
  Briefcase,
  LogOut,
  Menu,
  X,
  Pencil,
  Moon,
  Sun,
  MapPin,
  Calendar,
  Shield,
  Mail
} from 'lucide-react';

import logo from '@/images/3pl1.png';

type Section =
  | 'overview'
  | 'attendance'
  | 'payroll'
  | 'documents'
  | 'information'
  | 'leave';

const navigation = [
  {
    key: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: Clock3,
  },
  {
    key: 'payroll',
    label: 'Payroll',
    icon: Wallet,
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: FileText,
  },
  {
    key: 'information',
    label: 'Information',
    icon: User,
  },
  {
    key: 'leave',
    label: 'Leave Request',
    icon: Briefcase,
  },
];

export const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const { employee, user, logout, setEmployee, setUser } =
    useAuth();

  const [activeSection, setActiveSection] =
    useState<Section>('overview');

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [leaveFormOpen, setLeaveFormOpen] =
    useState(false);
  const [leaveHistoryOpen, setLeaveHistoryOpen] = useState(false);

  const [payslipOpen, setPayslipOpen] =
    useState(false);

  const [selectedPayslip, setSelectedPayslip] =
    useState<any>(null);

  const [darkMode, setDarkMode] =
    useState<boolean>(() => {
      return (
        localStorage.getItem('theme') ===
        'dark'
      );
    });

  /* ===================================
     THEME
  =================================== */

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(
        'theme',
        'light'
      );
    }
  }, [darkMode]);

  /* ===================================
     PAYROLL
  =================================== */

  const payrollQuery = useGetPayroll({
    employee_id: employee?.id,
  });

  const payrolls = useMemo(
    () =>
      normalizeApiResponse(
        payrollQuery.data
      ) as any[],
    [payrollQuery.data]
  );

  /* ===================================
     HELPERS
  =================================== */

  const refreshSessionEmployee = useCallback(async () => {
    try {
      const data = await authAPI.getCurrentUser();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
      if (data.employee) {
        setEmployee(data.employee);
        localStorage.setItem('currentEmployee', JSON.stringify(data.employee));
      }
    } catch (e) {
      console.error(e);
    }
  }, [setEmployee, setUser]);

  const formatCurrency = (
    amount: number
  ) => {
    return new Intl.NumberFormat(
      'en-PH',
      {
        style: 'currency',
        currency: 'PHP',
      }
    ).format(amount || 0);
  };

  /* ===================================
     RENDER SECTION
  =================================== */

  const renderSection = () => {
    switch (activeSection) {
      /* ===================================
         OVERVIEW
      =================================== */

      case 'overview':
        return (
          <div className="space-y-6">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#8B0000] via-red-700 to-red-900 p-6 md:p-10 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_40%)]" />

              <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
                {/* PROFILE */}
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                    <img
                      src={
                        employee?.profile_image_url ||
                        'https://via.placeholder.com/300'
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {employee?.full_name}
                    </h1>

                    <p className="mt-2 text-white/80 text-lg">
                      {employee?.position}
                    </p>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
                      <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-sm flex items-center gap-2">
                        <MapPin size={15} />
                        {employee?.hub_name ||
                          'N/A'}
                      </div>

                      <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-sm flex items-center gap-2">
                        <Calendar size={15} />
                        {employee?.hired_date
                          ? new Date(
                              employee.hired_date
                            ).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION */}
                <div className="lg:ml-auto">
                  <button
                    onClick={() =>
                      setEditOpen(true)
                    }
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white text-[#8B0000] font-semibold shadow-xl hover:scale-[1.02] transition"
                  >
                    <div className="flex items-center gap-2">
                      <Pencil size={18} />
                      Edit Profile
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: 'Employment',
                  value:
                    employee?.employment_type ||
                    'Full-time',
                },
                {
                  label: 'Status',
                  value:
                    employee?.status ||
                    'Active',
                },
                {
                  label: 'Role',
                  value:
                    employee?.role ||
                    'Employee',
                },
                {
                  label: 'Employee ID',
                  value:
                    employee?.employee_id ||
                    'N/A',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="rounded-3xl bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.label}
                  </p>

                  <h3 className="mt-2 font-bold text-lg text-gray-500 dark:text-gray-400">
                    {item.value}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        );

      /* ===================================
         ATTENDANCE
      =================================== */

      case 'attendance':
        return (
          <div className="rounded-[30px] bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                Attendance
              </h2>
            </div>

            {/* ONLY ATTENDANCE */}
            <div className="p-6">
              <EmployeeSidebar
                employeeId={
                  employee?.id || 0
                }
                employee={employee || {}}
              />
            </div>
          </div>
        );

      /* ===================================
         PAYROLL
      =================================== */

      case 'payroll':
        return (
          <div className="space-y-4">
            {payrolls?.map(
              (payroll: any) => (
                <div
                  key={payroll.id}
                  className="rounded-[28px] bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-500 dark:text-gray-400 text-lg">
                        {
                          payroll.pay_period
                        }
                      </p>

                      <p className="mt-2 text-3xl font-bold text-green-600">
                        {formatCurrency(
                          payroll.net_pay
                        )}
                      </p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-xs font-semibold ${
                        payroll.status ===
                        'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {payroll.status}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPayslip(
                        payroll
                      );

                      setPayslipOpen(true);
                    }}
                    className="mt-5 w-full rounded-2xl bg-[#4F7BFF] text-white py-3 font-semibold hover:opacity-90 transition"
                  >
                    View Payslip
                  </button>
                </div>
              )
            )}
          </div>
        );

      /* ===================================
         DOCUMENTS
      =================================== */

      case 'documents':
        return (
          <div className="rounded-[30px] bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                Documents
              </h2>
            </div>

            <div className="p-6">
              <DocumentsSection
                documents={
                  employee?.documents || []
                }
                employeeId={
                  employee?.id || 0
                }
                onUpdate={refreshSessionEmployee}
              />
            </div>
          </div>
        );

      /* ===================================
         INFORMATION
      =================================== */

      case 'information':
        return (
          <div className="space-y-6">
            <div className="rounded-[30px] bg-gradient-to-r from-[#8B0000] to-red-700 p-6 md:p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold">
                Employee Information
              </h2>

              <p className="mt-2 text-white/80">
                Personal details,
                emergency contact, and
                government information.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <InfoCard
                title="Personal Information"
                icon={<User size={18} />}
              >
                <InfoItem
                  label="Full Name"
                  value={
                    employee?.full_name
                  }
                />

                <InfoItem
                  label="Gender"
                  value={employee?.gender}
                />

                <InfoItem
                  label="Nationality"
                  value={
                    employee?.nationality
                  }
                />

                <InfoItem
                  label="Marital Status"
                  value={
                    employee?.marital_status
                  }
                />
              </InfoCard>

              <InfoCard
                title="Contact Information"
                icon={<Mail size={18} />}
              >
                <InfoItem
                  label="Email"
                  value={
                    employee?.email_address
                  }
                />

                <InfoItem
                  label="Phone"
                  value={
                    employee?.phone_number
                  }
                />

                <InfoItem
                  label="Address"
                  value={
                    employee?.current_address
                  }
                />
              </InfoCard>

              <InfoCard
                title="Employment Information"
                icon={
                  <Briefcase size={18} />
                }
              >
                <InfoItem
                  label="Position"
                  value={
                    employee?.position
                  }
                />

                <InfoItem
                  label="Hub"
                  value={
                    employee?.hub_name
                  }
                />

                <InfoItem
                  label="Employment Type"
                  value={
                    employee?.employment_type
                  }
                />
              </InfoCard>

              <InfoCard
                title="Government IDs"
                icon={<Shield size={18} />}
              >
                <InfoItem
                  label="TIN"
                  value={employee?.tin}
                />

                <InfoItem
                  label="SSS"
                  value={employee?.sss}
                />

                <InfoItem
                  label="PhilHealth"
                  value={
                    employee?.philhealth
                  }
                />

                <InfoItem
                  label="Pag-IBIG"
                  value={
                    employee?.pagibig
                  }
                />
              </InfoCard>
              <InfoCard
                title="Emergency Contact"
                icon={<User size={18} />}
              >
                <InfoItem
                  label="Contact Name"
                  value={employee?.emergency_contact_name}
                />

                <InfoItem
                  label="Relationship"
                  value={employee?.emergency_contact_relationship}
                />

                <InfoItem
                  label="Phone Number"
                  value={employee?.emergency_contact_phone}
                />
              </InfoCard>
            </div>
          </div>
        );
              

      /* ===================================
         LEAVE
      =================================== */

      case 'leave':
        return (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#4F7BFF] to-[#315BFF] p-8 md:p-10 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10 max-w-2xl">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Briefcase size={32} />
                </div>

                <h2 className="mt-6 text-3xl md:text-4xl font-bold">
                  Leave Request
                </h2>

                <p className="mt-4 text-lg text-white/80 leading-relaxed">
                  Submit your leave request
                  and monitor approval
                  status through the portal.
                </p>

                <button
                  onClick={() =>
                    setLeaveFormOpen(true)
                  }
                  className="mt-8 px-8 py-4 rounded-2xl bg-white text-[#315BFF] font-bold shadow-xl hover:scale-[1.02] transition-all"
                >
                  Submit Leave
                </button>
                <button
                  onClick={() => setLeaveHistoryOpen(true)}
                  className="mt-8 ml-3 px-6 py-3 rounded-2xl bg-white/10 text-white/90 font-semibold border border-white/20"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#070B14] transition-colors">
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <div className="flex">
        {/* SIDEBAR */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[280px] bg-white dark:bg-[#0F172A]/95 backdrop-blur border-r border-gray-200 dark:border-gray-700 shadow-2xl lg:shadow-none transform transition-transform duration-300 ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* LOGO */}
          <div className="h-20 px-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <img
              src={logo}
              alt=""
              className="w-12 h-12 object-contain"
            />

            <div>
              <h2 className="font-bold text-gray-500 dark:text-gray-400">
                3PL COMPANY
              </h2>

            </div>
          </div>

          {/* PROFILE */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden">
                <img
                  src={
                    employee?.profile_image_url ||
                    'https://via.placeholder.com/150'
                  }
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-semibold text-gray-500 dark:text-gray-400">
                  {employee?.full_name}
                </h3>

                <p className="text-sm text-gray-500">
                  {employee?.position}
                </p>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                activeSection === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveSection(
                      item.key as Section
                    );

                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#8B0000] to-red-700 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />

                  <span className="font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
            

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="flex-1 min-w-0">
          {/* HEADER */}
          <header className="sticky top-0 z-30 h-20 bg-white/90 dark:bg-[#0F172A]/80 backdrop-blur-xl backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setMobileOpen(true)
                }
                className="lg:hidden w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:dark:bg-gray-600 flex items-center justify-center"
              >
                <Menu size={20} />
              </button>

              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-400">
                  3PL COMPANY
                </h1>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center w-14 h-8 rounded-full px-1 transition-colors
                          bg-gray-300 dark:bg-gray-700"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform flex items-center justify-center
                    ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}
                >
                  {darkMode ? (
                    <Sun size={14} className="text-yellow-500" />
                  ) : (
                    <Moon size={14} className="text-gray-700" />
                  )}
                </div>
              </button>

              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                <img
                  src={
                    employee?.profile_image_url ||
                    'https://via.placeholder.com/150'
                  }
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="p-4 md:p-8">
            {renderSection()}
          </main>
        </div>
      </div>

      {/* EDIT MODAL */}
      <EmployeeEditModal
        isOpen={editOpen}
        onClose={() =>
          setEditOpen(false)
        }
        employee={employee}
        onSuccess={() =>
          window.location.reload()
        }
      />

      {/* PAYSLIP */}
      <PayslipDetailModal
        isOpen={payslipOpen}
        onClose={() =>
          setPayslipOpen(false)
        }
        payslip={selectedPayslip}
      />

      {/* LEAVE MODAL */}
      <Modal
        isOpen={leaveFormOpen}
        onClose={() => setLeaveFormOpen(false)}
        title="Leave Request"
        size="xl"
      >
        <div className="p-4 sm:p-6">
          <EmployeeLeaveRequestForm showHeader={false} />
        </div>
      </Modal>

      {/* LEAVE HISTORY */}
      <EmployeeLeaveHistoryModal isOpen={leaveHistoryOpen} onClose={() => setLeaveHistoryOpen(false)} />
    </div>
  );
};

export default EmployeeDashboard;