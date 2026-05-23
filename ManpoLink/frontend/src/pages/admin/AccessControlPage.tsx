import { useState, useMemo } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { EmployeeAccessControlModal } from '@/components/EmployeeAccessControlModal';
import { useGetEmployees, useGetActivityLogs, useGetSecurityAlerts } from '@/hooks/useQueries';
import { Search, AlertTriangle } from 'lucide-react';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { Sidebar } from '@/components/Sidebar';

export const AccessControlPage = () => {
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [hubFilter, setHubFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch data
  const { data: employeesData, isLoading, refetch: refetchEmployees } = useGetEmployees();
  const { data: activityLogsData } = useGetActivityLogs({ limit: 10 });
  const { data: securityAlertsData } = useGetSecurityAlerts();

  const handleManageClick = (employee: any) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleModalUpdate = () => {
    refetchEmployees();
    handleModalClose();
  };

  const employees = normalizeApiResponse(employeesData);
  const activityLogs = normalizeApiResponse(activityLogsData);
  const securityAlerts = normalizeApiResponse(securityAlertsData);

  // Get unique roles and hubs for filters
  const roles = useMemo(() => {
    const uniqueRoles = new Set(employees.map((emp: any) => emp.role));
    return ['All', ...Array.from(uniqueRoles)];
  }, [employees]);

  const hubs = useMemo(() => {
    const uniqueHubs = new Set(employees.map((emp: any) => emp.hub_name));
    return ['All', ...Array.from(uniqueHubs).filter(Boolean)];
  }, [employees]);

  // Calculate stats
  const totalUsers = employees.length;
  const activeUsers = employees.filter((emp: any) => emp.is_active && emp.can_login).length;
  const lockedAccounts = employees.filter((emp: any) => !emp.can_login).length;
  const blacklistedUsers = employees.filter((emp: any) => !emp.is_active).length;

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: any) => {
      const matchesSearch =
        !searchTerm ||
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jtp_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && emp.is_active) ||
        (statusFilter === 'Deactivated' && !emp.is_active);
      const matchesHub = hubFilter === 'All' || emp.hub_name === hubFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesHub;
    });
  }, [employees, searchTerm, roleFilter, statusFilter, hubFilter]);

  if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    </div>
  );
}

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
    <Sidebar
      open={sidebarOpen}
      onToggle={() => setSidebarOpen(!sidebarOpen)}
    />
      <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Access Control</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage user access and security</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-4 border-orange-500">
          <div className="text-center">
            <p className="text-orange-600 font-semibold text-sm">Total Users</p>
            <p className="text-5xl font-bold text-orange-600 mt-3">{totalUsers}</p>
          </div>
        </Card>

        {/* Active Users */}
        <Card className="border-4 border-green-500">
          <div className="text-center">
            <p className="text-green-600 font-semibold text-sm">Active users</p>
            <p className="text-5xl font-bold text-green-600 mt-3">{activeUsers}</p>
          </div>
        </Card>

        {/* Locked Accounts */}
        <Card className="border-4 border-red-500">
          <div className="text-center">
            <p className="text-red-600 font-semibold text-sm">Locked Accounts</p>
            <p className="text-5xl font-bold text-red-600 mt-3">{lockedAccounts}</p>
          </div>
        </Card>

        {/* Blacklisted Users */}
        <Card className="border-4 border-red-700">
          <div className="text-center">
            <p className="text-red-700 font-semibold text-sm">Blacklisted Users</p>
            <p className="text-5xl font-bold text-red-700 mt-3">{blacklistedUsers}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-full md:w-56"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              Role: {role}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full md:w-56"
        >
          <option value="All">Status: All</option>
          <option value="Active">Status: Active</option>
          <option value="Deactivated">Status: Deactivated</option>
        </select>

        <select
          value={hubFilter}
          onChange={(e) => setHubFilter(e.target.value)}
          className="input-field w-full md:w-56"
        >
          {hubs.map((hub) => (
            <option key={hub} value={hub}>
              Hub: {hub}
            </option>
          ))}
        </select>

        <div className="relative flex-1 w-full min-w-[240px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search user here..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field !pl-10 w-full"
          />
        </div>
      </div>

      {/* Access User List Table */}
      <Card>
        <h2 className="text-lg font-bold text-red-700 mb-4 border-b pb-3">Access User List</h2>

        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">JTP Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Fullname</th>
                  <th className="px-4 py-3 text-left font-semibold">Position</th>
                  <th className="px-4 py-3 text-left font-semibold">Hub</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp: any) => (
                  <tr key={emp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">{emp.jtp_code || emp.employee_id}</td>
                    <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                    <td className="px-4 py-3">{emp.position}</td>
                    <td className="px-4 py-3">{emp.hub_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          emp.is_active && emp.can_login
                            ? 'success'
                            : emp.can_login
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {emp.is_active && emp.can_login
                          ? 'Active'
                          : !emp.can_login
                          ? 'Locked'
                          : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleManageClick(emp)}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-1 px-4 rounded text-sm transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No users found" description="Try adjusting your filters" />
        )}
      </Card>
    </div>
      {selectedEmployee && (
        <EmployeeAccessControlModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          employee={selectedEmployee}
          onUpdate={handleModalUpdate}
        />
      )}
    </div>
  );
};

