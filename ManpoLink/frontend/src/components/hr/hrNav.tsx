import React from 'react';
import { Home, Users, MapPin, Shield, Clock, FileText, Activity, AlertTriangle, Edit } from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const hrNav: NavSection[] = [
  {
    items: [
      { to: '/hr', label: 'Dashboard', icon: <Home size={16} /> },
      { to: '/hr/employees', label: 'Employees', icon: <Users size={16} /> },
    ],
  },
  {
    title: 'Employee Request',
    items: [
      {
        to: '/hr/edit-requests',
        label: 'Edit Request',
        icon: <Edit size={14} />,
      },
      {
        to: '/hr/leave-requests',
        label: 'Leave Request',
        icon: <Edit size={14} />,
      },
    ],
  },
  {
    items: [
      { to: '/hr/hubs', label: 'Hubs', icon: <MapPin size={16} /> },
      { to: '/hr/access-control', label: 'Access Control', icon: <Shield size={16} /> },
      { to: '/hr/attendance', label: 'Attendance', icon: <Clock size={16} /> },
      { to: '/hr/payslip', label: 'Payslip', icon: <FileText size={16} /> },
      { to: '/hr/activity-logs', label: 'Activity Logs', icon: <Activity size={16} /> },
      { to: '/hr/security-alerts', label: 'Security Alerts', icon: <AlertTriangle size={16} /> },
    ],
  },
];

export default hrNav;
