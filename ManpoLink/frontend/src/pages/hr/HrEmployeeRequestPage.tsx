import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EditRequestsPanel } from '@/components/EditRequestsManagementPanel';

export default function HrEmployeeRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  return <EditRequestsPanel />;
}
