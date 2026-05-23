import { useEffect, useState } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { CheckCircle, XCircle, Clock, Trash2, Eye, Download, X } from 'lucide-react';
import { useClearAllLeaveRequests } from '@/hooks/useQueries';
import { Sidebar } from '@/components/Sidebar';
import { apiUrl } from '@/constants/api';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

type LeaveRequest = {
  id: number;
  employee: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewed_by: { username?: string } | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  attachments?: string[];
};

export const LeaveRequestsPanel = ({ initialFilter = 'pending' }: { initialFilter?: LeaveRequestStatus | 'all' }) => {
  const { success, error } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<LeaveRequestStatus | 'all'>(initialFilter);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'pdf' | 'other' } | null>(null);
  const clearAllMutation = useClearAllLeaveRequests();

  useEffect(() => {
    fetchLeaveRequests();
  }, [filterStatus]);


  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(apiUrl(`leave-requests${params}`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.status === 401) {
        // auth problem
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentEmployee');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch leave requests');
      const data = await response.json();
      setLeaveRequests(data.results || data);
    } catch (e) {
      error('Failed to fetch leave requests');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`leave-requests/${requestId}/approve/`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentEmployee');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error('Approve error', response.status, text);
        throw new Error('Failed to approve leave request');
      }
      success('Leave request approved successfully');
      fetchLeaveRequests();
    } catch (e) {
      error('Failed to approve leave request');
      console.error(e);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`leave-requests/${requestId}/reject/`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: rejectNotes[requestId] || '' }),
      });
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentEmployee');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error('Reject error', response.status, text);
        throw new Error('Failed to reject leave request');
      }
      success('Leave request rejected successfully');
      setRejectNotes((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      fetchLeaveRequests();
    } catch (e) {
      error('Failed to reject leave request');
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all leave requests shown? This action cannot be undone.')) {
      try {
        await clearAllMutation.mutateAsync();
        success('All leave requests cleared successfully.');
        fetchLeaveRequests();
      } catch (err) {
        error('Failed to clear leave requests.');
      }
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-4 lg:p-6 lg:ml-64">
          <Card>
            <div className="text-center py-8 flex items-center justify-center gap-3">
              <LoadingSpinner />
              <span className="text-gray-500 dark:text-gray-400">Loading leave requests...</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leave Requests</h1>
            <p className="text-gray-600 dark:text-gray-400">Review and approve/reject employee leave requests</p>
          </div>
          
          {leaveRequests.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearAllMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
            >
              {clearAllMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Trash2 size={16} />
                  Clear All Requests
                </>
              )}
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {leaveRequests.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">No leave requests found</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <Card key={request.id} className="p-0">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold">{request.employee_name}</h3>
                      <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {request.leave_type} • {request.start_date} to {request.end_date}
                    </p>

                    <p className="text-xs text-gray-500">
                      <Clock size={14} className="inline mr-1" />
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    {expandedId === request.id ? <X size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {expandedId === request.id && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <h4 className="font-semibold mb-2">Leave Details</h4>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="text-sm"><span className="font-medium text-gray-500 uppercase text-[10px] tracking-wider block">Type</span> {request.leave_type}</div>
                        <div className="text-sm"><span className="font-medium text-gray-500 uppercase text-[10px] tracking-wider block mt-2">Dates</span> {request.start_date} → {request.end_date}</div>
                        <div className="text-sm"><span className="font-medium text-gray-500 uppercase text-[10px] tracking-wider block mt-2">Reason</span> {request.reason || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <h4 className="font-semibold mb-2">Attachments</h4>
                      {(!request.attachments || request.attachments.length === 0) ? (
                        <div className="text-sm text-gray-500 italic">No attachments provided</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {request.attachments!.map((url, idx) => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                            const isPDF = /\.(pdf)$/i.test(url);
                            const nameMatch = url.split('/').pop() || `file-${idx}`;
                            return (
                              <div key={url} className="border border-gray-100 dark:border-gray-800 rounded-xl p-2 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-stretch group relative overflow-hidden">
                                <div className="flex-1 mb-2 flex items-center justify-center overflow-hidden relative aspect-video rounded-lg bg-gray-200 dark:bg-gray-800">
                                  {isImage ? (
                                    <img src={url} alt={`attachment-${idx}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-[10px] font-black uppercase tracking-widest">{isPDF ? 'PDF' : 'FILE'}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button 
                                      onClick={() => setPreviewFile({ url, type: isImage ? 'image' : isPDF ? 'pdf' : 'other' })}
                                      className="p-1.5 bg-white text-black rounded-full hover:scale-110 transition-transform"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <a href={url} download className="p-1.5 bg-white text-black rounded-full hover:scale-110 transition-transform">
                                      <Download size={14} />
                                    </a>
                                  </div>
                                </div>
                                <div className="text-[9px] truncate font-medium opacity-60 px-1">{nameMatch}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' ? (
                      <div className="space-y-3 pt-2 border-t dark:border-gray-800">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rejection Notes (optional)</label>
                          <textarea
                            value={rejectNotes[request.id] || ''}
                            onChange={(e) => setRejectNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                            placeholder="Add notes if rejecting..."
                            className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="success"
                            onClick={() => handleApprove(request.id)}
                            icon={<CheckCircle size={18} />}
                            className="flex-1 font-bold"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="error"
                            onClick={() => handleReject(request.id)}
                            icon={<XCircle size={18} />}
                            className="flex-1 font-bold"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                        <p className="text-[10px] font-medium text-gray-500">
                          Reviewed by <span className="text-gray-900 dark:text-white font-bold">{request.reviewed_by?.username || 'N/A'}</span>
                        </p>
                        <p className="text-[10px] font-medium text-gray-500">
                          Date <span className="text-gray-900 dark:text-white font-bold">{request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : 'N/A'}</span>
                        </p>
                        {request.notes && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded-lg text-xs italic">
                            "{request.notes}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {previewFile && (
        <AttachmentPreviewModal
          url={previewFile.url}
          type={previewFile.type}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
