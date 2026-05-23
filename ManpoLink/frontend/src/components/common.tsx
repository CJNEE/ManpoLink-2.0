import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/** HR and admin pages each render `Sidebar` + `min-h-screen` shell like the admin UI. */
export const Layout = ({ children }: LayoutProps) => {
  return <>{children}</>;
};

/* =========================
   UI COMPONENTS (CLEAN + FAST)
========================= */

export const Card = ({ children, className = '', hover = false }: any) => {
  return (
    <div
      className={`bg-white dark:bg-[#0F172A]
        border border-gray-200 dark:border-gray-700
        rounded-xl p-4
        ${hover ? 'hover:shadow-lg dark:hover:shadow-none hover:-translate-y-1 transition-transform duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'error' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg';

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
  [k: string]: any;
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium active:scale-95 transition-transform';

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary:
      'bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-600 text-white hover:bg-green-700',
    error: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  return (
    <button
      className={`${base} ${sizes[size as ButtonSize]} ${variants[variant as ButtonVariant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export const Badge = ({ variant = 'info', children }: any) => {
  const styles = {
    success:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${styles[variant as BadgeVariant]}`}>
      {children}
    </span>
  );
};

export const LoadingSpinner = ({ size = 'md' }: any) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizes[size as 'sm' | 'md' | 'lg']} border-4 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin`}
    />
  );
};

export const ErrorMessage = ({ message, onRetry }: any) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-lg flex justify-between">
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
    </div>
  );
};

export const EmptyState = ({ title, description, action }: any) => {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action}
    </div>
  );
};