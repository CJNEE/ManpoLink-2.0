export const COLORS = {
  primary: '#C41E3A',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  darkBg: '#1F2937',
  cardBg: '#F3F4F6',
  lightBg: '#FFFFFF',
  darkCardBg: '#1E1E1E',
} as const;

export const STATUS_COLORS = {
  active: '#10B981',
  inactive: '#6B7280',
  awol: '#F59E0B',
  blacklist: '#EF4444',
  present: '#10B981',
  late: '#F59E0B',
  absent: '#EF4444',
  pending: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
} as const;

export const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Regular': '#10B981',
  'Contractual': '#3B82F6',
  'Probationary': '#F59E0B',
  'Casual': '#8B5CF6',
} as const;

export const ROLE_COLORS: Record<string, string> = {
  'Admin': '#C41E3A',
  'HR': '#3B82F6',
  'Employee': '#10B981',
  'Manager': '#8B5CF6',
} as const;
