import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AccessControlPage } from '@/pages/admin/AccessControlPage';

export default function HrAccessControlPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  return <AccessControlPage />;
}
