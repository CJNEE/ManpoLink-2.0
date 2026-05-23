import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button, Badge, LoadingSpinner, EmptyState } from './common';
import { useGetEmployees, useDeleteEmployee, useBulkToggleLogin } from '@/hooks/useQueries';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from './ConfirmDialog';
import { Trash2, Eye, Lock, Unlock } from 'lucide-react';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

interface Employee {
  id: number;
  full_name: string;
  firstname: string;
  lastname: string;
  middle_initial?: string;
  position: string;
  employment_type: string;
  status: string;
  hub_name?: string;
  employee_id: string;
  jtp_code: string;
  can_login: boolean;
  can_edit_info: boolean;
  profile_image_url?: string;
}

export const EmployeeManagePanel = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isHR, canDeleteEmployees } = useAuth();
  const { data, isLoading } = useGetEmployees();
  const deleteMutation = useDeleteEmployee();
  const bulkToggleMutation = useBulkToggleLogin();
  const { success, error } = useToast();

  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, employeeId: 0 });

  const employees = normalizeApiResponse(data);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(employees.map((emp: Employee) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, id]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteConfirm.employeeId);
      success('Employee deleted successfully');
      setDeleteConfirm({ isOpen: false, employeeId: 0 });
    } catch (err) {
      error('Failed to delete employee');
    }
  };

  const handleBulkToggleLogin = async (canLogin: boolean) => {
    if (selectedEmployees.length === 0) {
      error('Please select employees');
      return;
    }

    try {
      await bulkToggleMutation.mutateAsync({ employeeIds: selectedEmployees, canLogin });
      success(`Login ${canLogin ? 'enabled' : 'disabled'} for selected employees`);
      setSelectedEmployees([]);
    } catch (err) {
      error('Failed to update employee login status');
    }
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="space-y-4">
          {/* Bulk Actions */}
          {selectedEmployees.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg flex items-center justify-between">
              <p className="text-sm font-medium">{selectedEmployees.length} employee(s) selected</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleBulkToggleLogin(true)}
                  isLoading={bulkToggleMutation.isPending}
                >
                  <Unlock size={16} />
                  Enable Login
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleBulkToggleLogin(false)}
                  isLoading={bulkToggleMutation.isPending}
                >
                  <Lock size={16} />
                  Disable Login
                </Button>
              </div>
            </div>
          )}

          {/* Employee Table */}
          {employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.length === employees.length && employees.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Login</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: Employee) => (
                    <tr key={emp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={(e) => handleSelectEmployee(emp.id, e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{emp.full_name}</td>
                      <td className="px-4 py-3 text-sm">{emp.employee_id}</td>
                      <td className="px-4 py-3 text-sm">{emp.position}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={emp.status === 'Active' ? 'success' : 'warning'}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={emp.can_login ? 'success' : 'error'}>
                          {emp.can_login ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2 flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const rawRole = (user?.role || '').toString().trim().toLowerCase();
                            const normalizedRole = rawRole.includes('admin') ? 'admin' : rawRole.includes('hr') ? 'hr' : rawRole;
                            const base = normalizedRole === 'hr' ? '/hr' : normalizedRole === 'admin' ? '/admin' : '/employee';
                            navigate(`${base}/employees/${emp.id}`);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        {canDeleteEmployees && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteConfirm({ isOpen: true, employeeId: emp.id })}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No employees found" />
          )}
        </div>
      </Card>

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Employee?"
        message="This action cannot be undone. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, employeeId: 0 })}
        confirmText="Delete"
        isDangerous
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
