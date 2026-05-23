import React, { ReactNode } from 'react';

// Extend HTMLAttributes to inherit all standard div props (including onClick, style, etc.)
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div
      className={`backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl shadow-lg p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
