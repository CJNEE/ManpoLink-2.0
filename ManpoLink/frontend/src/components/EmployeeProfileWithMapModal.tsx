import { useState } from 'react';
import { Modal } from './Modal';
import { ChevronDown } from 'lucide-react';

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
  hub_id?: number;
  employee_id: string;
  jtp_code: string;
  can_login: boolean;
  can_edit_info: boolean;
  profile_image_url?: string;
  phone_number?: string;
  email_address?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  current_address?: string;
}

interface EmployeeProfileWithMapModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeProfileWithMapModal = ({
  employee,
  isOpen,
  onClose,
}: EmployeeProfileWithMapModalProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  if (!employee) return null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'resign':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'awol':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'blacklist':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Details" size="xl">
      <div className="space-y-4 relative">
        {/* Employee Details Card - This stays on top */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 shadow-md border border-blue-200 dark:border-gray-600 relative z-30">
          {/* Header with Profile */}
          <div className="flex items-start gap-4">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {employee.profile_image_url ? (
                <img
                  src={employee.profile_image_url}
                  alt={employee.full_name}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white dark:border-gray-600 shadow-sm">
                  {employee.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Employee Info */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{employee.full_name}</h2>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(employee.status)}`}>
                  {employee.status}
                </span>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Position</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{employee.position}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">JTP Code</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{employee.jtp_code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Employment</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{employee.employment_type}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Hub</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{employee.hub_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Below */}
        <div
          className="space-y-4"
          style={{
            maxHeight: 'calc(100vh - 400px)',
            overflowY: 'auto',
          }}
        >
          {/* Basic Information */}
          <button
            onClick={() => toggleSection('basic')}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            <ChevronDown
              size={20}
              className={`text-gray-600 dark:text-gray-400 transition-transform ${
                expandedSection === 'basic' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'basic' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">First Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">{employee.firstname}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">{employee.lastname}</p>
              </div>
              {employee.middle_initial && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Middle Initial</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{employee.middle_initial}</p>
                </div>
              )}
              {employee.gender && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{employee.gender}</p>
                </div>
              )}
              {employee.date_of_birth && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{employee.date_of_birth}</p>
                </div>
              )}
              {employee.marital_status && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Marital Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{employee.marital_status}</p>
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          <button
            onClick={() => toggleSection('contact')}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Contact Information</h3>
            <ChevronDown
              size={20}
              className={`text-gray-600 dark:text-gray-400 transition-transform ${
                expandedSection === 'contact' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'contact' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
              {employee.email_address && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white break-all">{employee.email_address}</p>
                </div>
              )}
              {employee.phone_number && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{employee.phone_number}</p>
                </div>
              )}
              {employee.current_address && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Address</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{employee.current_address}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400 text-center relative z-10 border border-gray-200 dark:border-gray-700">
          <p>Employee account status: <span className="font-semibold">{employee.can_login ? '✓ Can Login' : '✗ Cannot Login'}</span></p>
          <p>Edit info allowed: <span className="font-semibold">{employee.can_edit_info ? '✓ Yes' : '✗ No'}</span></p>
        </div>
      </div>
    </Modal>
  );
};
