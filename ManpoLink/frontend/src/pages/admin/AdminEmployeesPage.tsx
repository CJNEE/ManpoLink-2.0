import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { EmployeeManagePanel } from '@/components/EmployeeManagePanel';
import { AddEmployee } from '@/pages/admin/AddEmployee';

import { useAuth } from '@/hooks/useAuth';

export const AdminEmployeesPage = () => {
  const { canEditEmployeeInfo } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // When showAdd is true, keep Sidebar visible and render only AddEmployee content area
  if (showAdd) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className="p-4 lg:p-6 lg:ml-64">
          <AddEmployee onClose={() => setShowAdd(false)} onCancel={() => setShowAdd(false)} onCreated={() => setShowAdd(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Employee Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage employees and their information</p>
          </div>

          {canEditEmployeeInfo && (
            <div>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                Add Employee
              </button>
            </div>
          )}
        </div>

        <EmployeeManagePanel />
      </div>
    </div>
  );
};

export default AdminEmployeesPage;