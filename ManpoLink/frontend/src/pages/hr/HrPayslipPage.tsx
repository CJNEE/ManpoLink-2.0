import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PayslipPage } from '@/pages/admin/PayslipPage';

export default function HrPayslipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  return <PayslipPage />;
}
