import { useState } from 'react';
import { Modal } from './Modal';
import { Button, LoadingSpinner } from './common';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/api/apiService';
import { Key, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      error('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 8) {
      error('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/change-password/', {
        old_password: formData.current_password,
        new_password: formData.new_password,
      });

      success('Password changed successfully');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
      onClose();
    } catch (err: any) {
      console.error('Password change error:', err);
      error(err.response?.data?.error || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Settings" size="sm">
      <div className="p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/30">
            <Lock size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Update Password</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2 italic">Maintain your account security</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Current Password</label>
            <div className="relative group">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">New Password</label>
            <div className="relative group">
              <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Confirm Password</label>
            <div className="relative group">
              <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                placeholder="Re-type new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-xl transition-all shadow-xl shadow-red-600/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> <span>Updating...</span>
                </div>
              ) : (
                'Secure Account'
              )}
            </button>
          </div>
        </form>

        <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest leading-relaxed">
          Changing your password will not log you out <br /> of your current session.
        </p>
      </div>
    </Modal>
  );
};
