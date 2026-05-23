import { useState } from 'react';
import { Card, Badge, Button } from './common';
import { useApproveEditRequest, useRejectEditRequest, useGetEditRequests } from '@/hooks/useQueries';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from './ConfirmDialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

export const EditRequestsPanel = () => {
  const { data, isLoading } = useGetEditRequests({ status: 'pending' });
  const approveMutation = useApproveEditRequest();
  const rejectMutation = useRejectEditRequest();
  const { success, error } = useToast();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject';
    requestId: number;
  }>({ isOpen: false, action: 'approve', requestId: 0 });

  const requests = normalizeApiResponse(data);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(confirmDialog.requestId);
      success('Request approved successfully');
      setConfirmDialog({ isOpen: false, action: 'approve', requestId: 0 });
    } catch (err) {
      error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(confirmDialog.requestId);
      success('Request rejected successfully');
      setConfirmDialog({ isOpen: false, action: 'reject', requestId: 0 });
    } catch (err) {
      error('Failed to reject request');
    }
  };

  if (isLoading) {
    return <Card><p>Loading...</p></Card>;
  }

  return (
    <>
      <Card>
        <h2 className="text-lg font-semibold mb-4">Edit Requests</h2>
        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex-1">
                  <p className="font-medium">{req.employee_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{req.field}: {req.old_value} → {req.new_value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{req.created_at}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmDialog({ isOpen: true, action: 'approve', requestId: req.id })}
                    className="whitespace-nowrap"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDialog({ isOpen: true, action: 'reject', requestId: req.id })}
                    className="whitespace-nowrap"
                  >
                    <XCircle size={16} />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === 'approve' ? 'Approve Request?' : 'Reject Request?'}
        message={`Are you sure you want to ${confirmDialog.action} this edit request?`}
        onConfirm={confirmDialog.action === 'approve' ? handleApprove : handleReject}
        onCancel={() => setConfirmDialog({ isOpen: false, action: 'approve', requestId: 0 })}
        confirmText={confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
        isDangerous={confirmDialog.action === 'reject'}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </>
  );
};
