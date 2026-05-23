import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { editRequestAPI } from '@/api/apiService';
import { useApproveEditRequest, useRejectEditRequest } from '@/hooks/useQueries';
import { Card, LoadingSpinner, Button } from '@/components/common';
import { Sidebar } from '@/components/Sidebar';

export default function HrEditRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const requestId = Number(id || 0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['edit-request', requestId],
    queryFn: () => editRequestAPI.getEditRequest(requestId),
    enabled: !!requestId,
  });

  const approve = useApproveEditRequest();
  const reject = useRejectEditRequest();
  const [rejectNotes, setRejectNotes] = useState('');

  const handleApprove = () => {
    if (!window.confirm('Approve this edit request?')) return;
    approve.mutate(requestId, { onSuccess: () => refetch() });
  };

  const handleReject = () => {
    if (!window.confirm('Reject this edit request?')) return;
    reject.mutate({ id: requestId, notes: rejectNotes }, { onSuccess: () => refetch() });
  };

  if (!requestId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-4 lg:p-6 lg:ml-64">
          <p className="text-gray-600 dark:text-gray-400">Invalid request id</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Request</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and approve or reject this employee edit request</p>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : !data ? (
            <div className="p-6 text-gray-600 dark:text-gray-400">Request not found.</div>
          ) : (
            <div className="space-y-4 p-2">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.employee_name || data.requested_by_name || 'Unknown'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Requested: {new Date(data.created_at).toLocaleString()}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Requested changes</h4>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto text-gray-800 dark:text-gray-200">
                  {JSON.stringify(data.changes || data.payload || data.details || data.requested_data || {}, null, 2)}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Rejection notes (optional)
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="success" onClick={handleApprove}>
                  Approve
                </Button>
                <Button variant="danger" onClick={handleReject}>
                  Reject
                </Button>
                <Button variant="secondary" onClick={() => navigate('/hr/edit-requests')}>
                  Back to list
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
