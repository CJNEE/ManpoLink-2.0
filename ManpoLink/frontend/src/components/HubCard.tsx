import React from 'react';
import { Hub } from '@/types';

interface HubCardProps {
  hub: Hub;
  employeeCount: number;
  onClick?: (hub: Hub) => void;
}

export default function HubCard({ hub, employeeCount, onClick }: HubCardProps) {
  return (
    <div
      className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 hover:shadow-xl transition-shadow cursor-pointer dark:bg-gray-800/50"
      onClick={() => onClick?.(hub)}
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{hub.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{hub.location || hub.city || 'N/A'}</p>
      <div className="mt-2 flex items-center justify-between text-gray-700 dark:text-gray-200">
        <span className="text-xs">Employees</span>
        <span className="font-medium">{employeeCount}</span>
      </div>
    </div>
  );
}
