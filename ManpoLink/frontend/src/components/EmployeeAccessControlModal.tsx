import { useState, useEffect } from 'react';
import { HRPermission } from '@/types';
import { Modal } from './Modal';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/api/apiService';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { AlertCircle, Lock, Unlock, Shield, Key, Eye, EyeOff, ShieldCheck, UserCheck, Trash2, FileText, UserPlus } from 'lucide-react';
import { LoadingSpinner, Button } from './common';

interface EmployeeAccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onUpdate?: () => void;
}

export const EmployeeAccessControlModal = ({
  isOpen,
  onClose,
  employee,
  onUpdate,
}: EmployeeAccessControlModalProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountLocked, setAccountLocked] = useState(!employee?.can_login);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  // Manual Password State - Default to true as requested
  const [showManualPassword, setShowManualPassword] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [manualData, setManualData] = useState({
    password: '',
    confirm: '',
  });

  type PermKey = keyof Pick<HRPermission,
    'can_view_employees' | 'can_edit_employee_info' | 'can_edit_payslip' | 'can_delete_employees' | 'can_reset_password'>;

  const [hrPermissions, setHrPermissions] = useState<Record<PermKey, boolean>>({
    can_view_employees: false,
    can_edit_employee_info: false,
    can_edit_payslip: false,
    can_delete_employees: false,
    can_reset_password: false,
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Is the employee being managed an HR role?
  const isHR = employee?.role?.toLowerCase() === 'hr';

  // Load HR permissions when modal opens
  useEffect(() => {
    if (isOpen && employee && isHR) {
      loadHRPermissions();
    } else {
      setLoadingPermissions(false);
    }
  }, [isOpen, employee, isHR]);

  const loadHRPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await apiClient.get(`hr-permissions/?hr_employee=${employee.id}`);
      const permsList = normalizeApiResponse(response.data);
      if (permsList.length > 0) {
        const perms = permsList[0];
        setHrPermissions({
          can_view_employees: perms.can_view_employees || false,
          can_edit_employee_info: perms.can_edit_employee_info || false,
          can_edit_payslip: perms.can_edit_payslip || false,
          can_delete_employees: perms.can_delete_employees || false,
          can_reset_password: perms.can_reset_password || false,
        });
      }
    } catch (error: any) {
      console.error('Failed to load HR permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePermission = async (key: PermKey) => {
    const updatedValue = !hrPermissions[key];
    const updatedPermissions = {
      ...hrPermissions,
      [key]: updatedValue,
    };
    
    // Snappy optimistic UI update
    setHrPermissions(updatedPermissions);

    try {
      setIsLoading(true);
      const existingResponse = await apiClient.get(`hr-permissions/?hr_employee=${employee.id}`);
      const permsList = normalizeApiResponse(existingResponse.data);
      
      if (permsList.length > 0) {
        const permId = permsList[0].id;
        await apiClient.patch(`hr-permissions/${permId}/`, {
          ...updatedPermissions,
        });
      } else {
        await apiClient.post('hr-permissions/', {
          hr_employee: employee.id,
          ...updatedPermissions,
        });
      }
      toast.success('HR Administrative power updated');
      onUpdate?.();
    } catch (error: any) {
      // Revert local state on error
      setHrPermissions((prev) => ({
        ...prev,
        [key]: !updatedValue,
      }));
      toast.error(
        error?.response?.data?.error || error?.response?.data?.message || 'Failed to save permissions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccountLock = async (newLockedState: boolean) => {
    try {
      setIsLoading(true);
      const action = newLockedState ? 'lock' : 'unlock';
      const response = await apiClient.patch(
        `lock-unlock-account/${employee.id}/`,
        { action }
      );
      
      setAccountLocked(newLockedState);
      toast.success(response.data.message);
      onUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || `Failed to ${newLockedState ? 'lock' : 'unlock'} account`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setIsLoading(true);
      const existingResponse = await apiClient.get(`hr-permissions/?hr_employee=${employee.id}`);
      const permsList = normalizeApiResponse(existingResponse.data);
      
      if (permsList.length > 0) {
        const permId = permsList[0].id;
        await apiClient.patch(`hr-permissions/${permId}/`, {
          ...hrPermissions,
        });
      } else {
        await apiClient.post('hr-permissions/', {
          hr_employee: employee.id,
          ...hrPermissions,
        });
      }
      
      toast.success('HR Permissions saved successfully');
      onUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to save permissions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (manualData.password !== manualData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (manualData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      const payload = { manual_password: manualData.password };
      await apiClient.post(`reset-password/${employee.id}/`, payload);
      
      toast.success('Password updated successfully');
      setManualData({ password: '', confirm: '' });
      onUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || 'Failed to update password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'resign': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'awol': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'blacklist': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access & Security Control" size="sm">
      <div className="p-0 overflow-hidden">
        {/* Profile Header */}
        <div className="p-8 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                {employee?.profile_image_url ? (
                  <img
                    src={employee.profile_image_url}
                    alt={employee.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-3xl font-black">
                    {employee?.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${getStatusBadgeClass(employee?.status)}`}>
                {employee?.status || 'Active'}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{employee?.full_name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-650 mt-1">{employee?.position}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">#{employee?.employee_id}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Account Lock/Unlock */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-gray-400" />
              <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Security Access</h4>
            </div>
            <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${accountLocked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {accountLocked ? <Lock size={24} /> : <Unlock size={24} />}
                </div>
                <div>
                  <label className="text-sm font-black text-gray-900 dark:text-white block">{accountLocked ? 'Account Locked' : 'Access Granted'}</label>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{accountLocked ? 'No login capabilities' : 'Full system availability'}</p>
                </div>
              </div>
              <button
                onClick={() => toggleAccountLock(!accountLocked)}
                disabled={isLoading}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${accountLocked ? 'bg-gray-200 dark:bg-gray-700' : 'bg-red-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${accountLocked ? 'translate-x-1' : 'translate-x-6'}`} />
              </button>
            </div>
          </section>

          {/* HR Permissions Section - Only show if employee is HR */}
          {isHR && (
            <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-red-600" />
                <h4 className="font-black text-[10px] uppercase tracking-widest text-red-600">HR Administrative Powers</h4>
              </div>

              {loadingPermissions ? (
                <div className="text-center py-6"><LoadingSpinner size="sm" /></div>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: 'can_view_employees', label: 'View Employee Records', icon: FileText, desc: 'HR can view employee directory' },
                    { key: 'can_edit_employee_info', label: 'Modify Personnel Info', icon: UserPlus, desc: 'HR can edit employee details' },
                    { key: 'can_edit_payslip', label: 'Process Payroll/Payslips', icon: ShieldCheck, desc: 'HR can manage salary records' },
                    { key: 'can_delete_employees', label: 'Terminate/Delete Staff', icon: Trash2, desc: 'HR can remove employee accounts' },
                    { key: 'can_reset_password', label: 'Security Management', icon: Key, desc: 'HR can reset user passwords' },
                  ].map((perm) => (
                    <div key={perm.key} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/20 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-red-600 transition-colors">
                          <perm.icon size={16} />
                        </div>
                        <div>
                          <label className="text-[11px] font-black text-gray-700 dark:text-gray-200 block uppercase tracking-tight">{perm.label}</label>
                          <p className="text-[9px] text-gray-400 font-medium">{perm.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePermission(perm.key as PermKey)}
                        disabled={isLoading}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 ${hrPermissions[perm.key as PermKey] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${hrPermissions[perm.key as PermKey] ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                  
                  <Button
                    onClick={handleSavePermissions}
                    isLoading={isLoading}
                    variant="primary"
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all shadow-xl shadow-red-600/20"
                  >
                    Apply Administrative Changes
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Password Management */}
          <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Key size={16} className="text-gray-400" />
              <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Credentials Management</h4>
            </div>

            <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">System Username</label>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{employee?.user_info?.username || employee?.employee_id || 'Not Set'}</p>
                </div>
                <div className="px-3 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-500">
                  READ ONLY
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">New Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={manualData.password}
                      onChange={(e) => setManualData({...manualData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-600 transition-all"
                      placeholder="At least 8 characters"
                    />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={manualData.confirm}
                      onChange={(e) => setManualData({...manualData, confirm: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-600 transition-all"
                      placeholder="Re-type password"
                    />
                    <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleResetPassword}
                isLoading={isLoading}
                variant="primary"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-lg shadow-red-600/20"
              >
                Save Manual Password
              </Button>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
};
