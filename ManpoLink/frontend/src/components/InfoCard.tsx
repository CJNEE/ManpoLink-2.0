import { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export const InfoCard = ({ title, icon, children, className = '', action }: InfoCardProps) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#8B0000]">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

interface InfoItemProps {
  label: string;
  value: string | number | undefined | null;
  className?: string;
  highlight?: boolean;
}

export const InfoItem = ({ label, value, className = '', highlight = false }: InfoItemProps) => {
  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`font-medium ${highlight ? 'text-[#8B0000]' : 'text-gray-800'} text-sm`}>
        {value ?? 'N/A'}
      </span>
    </div>
  );
};

export default InfoCard;
