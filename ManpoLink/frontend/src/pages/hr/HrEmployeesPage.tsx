import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminEmployeesPage } from '@/pages/admin/AdminEmployeesPage';

export default function HrEmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  return <AdminEmployeesPage />;
}
