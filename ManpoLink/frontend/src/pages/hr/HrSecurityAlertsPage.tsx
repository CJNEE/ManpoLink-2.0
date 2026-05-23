import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SecurityAlertsPage } from '@/pages/admin/SecurityAlertsPage';

export default function HrSecurityAlertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  return <SecurityAlertsPage />;
}
