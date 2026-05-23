import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './common';
import { useUpdateEmployee } from '@/hooks/useQueries';
import { useToast } from '@/hooks/useToast';

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

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeProfileModal = ({ employee, isOpen, onClose }: EmployeeProfileModalProps) => {
  const { success } = useToast();

  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee.full_name}>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {employee.profile_image_url && (
          <img
            src={employee.profile_image_url}
            alt={employee.full_name}
            className="w-32 h-32 rounded-lg object-cover mx-auto"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">First Name</p>
            <p className="font-semibold">{employee.firstname}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Name</p>
            <p className="font-semibold">{employee.lastname}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Employee ID</p>
            <p className="font-semibold">{employee.employee_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">JTP Code</p>
            <p className="font-semibold">{employee.jtp_code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Position</p>
            <p className="font-semibold">{employee.position}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Employment Type</p>
            <p className="font-semibold">{employee.employment_type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-semibold">{employee.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hub</p>
            <p className="font-semibold">{employee.hub_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Can Login</p>
            <p className="font-semibold">{employee.can_login ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Can Edit Info</p>
            <p className="font-semibold">{employee.can_edit_info ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="primary" className="flex-1">
            Edit
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
