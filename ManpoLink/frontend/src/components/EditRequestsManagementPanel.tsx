import { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { Check, X, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useClearAllEditRequests } from '@/hooks/useQueries';
import { Sidebar } from '@/components/Sidebar';
import { apiUrl } from '@/constants/api';

interface EditRequest {
  id: number;
  employee: number;
  employee_name: string;
  changes_preview: string;
  requested_data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: any;
  reviewed_at: string;
  notes: string;
  image_url: string;
  created_at: string;
}

export const EditRequestsPanel = () => {
  const { success, error } = useToast();
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const clearAllMutation = useClearAllEditRequests();

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all edit requests shown? This action cannot be undone.')) {
      try {
        await clearAllMutation.mutateAsync();
        success('All edit requests cleared successfully.');
        fetchEditRequests();
      } catch (err) {
        error('Failed to clear edit requests.');
      }
    }
  };

  useEffect(() => {
    fetchEditRequests();
  }, [filterStatus]);
  
  const fetchEditRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(apiUrl(`edit-requests${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setEditRequests(data.results || data);
    } catch (err) {
      error('Failed to fetch edit requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`edit-requests/${requestId}/approve/`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to approve');
      success('Edit request approved successfully');
      fetchEditRequests();
    } catch (err) {
      error('Failed to approve edit request');
      console.error(err);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`edit-requests/${requestId}/reject/`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: rejectNotes[requestId] || ''
        })
      });
      if (!response.ok) throw new Error('Failed to reject');
      success('Edit request rejected successfully');
      setRejectNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });
      fetchEditRequests();
    } catch (err) {
      error('Failed to reject edit request');
      console.error(err);
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
            <div className="text-center py-8">
              <LoadingSpinner />
              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading edit requests...</p>
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
            <h1 className="text-3xl font-bold mb-2">Edit Requests</h1>
            <p className="text-gray-600 dark:text-gray-400">Review and approve/reject employee edit requests</p>
          </div>
          
          {editRequests.length > 0 && (
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
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
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

        {/* Edit Requests List */}
        {editRequests.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">No edit requests found</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {editRequests.map((request) => (
              <Card key={request.id} className="p-0">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{request.employee_name}</h3>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {request.changes_preview}
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
                    {expandedId === request.id ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <h4 className="font-semibold mb-2">Requested Changes:</h4>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                        {Object.entries(request.requested_data).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-500 uppercase text-[10px] tracking-wider block">{key}</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {request.image_url && (
                      <div>
                        <h4 className="font-semibold mb-2">Attached Image:</h4>
                        <div className="relative group max-w-xs">
                          <img
                            src={request.image_url}
                            alt="Attached"
                            className="rounded-xl shadow-lg border border-gray-100 dark:border-gray-800"
                          />
                          <a 
                            href={request.image_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                          >
                            <span className="text-white text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">View Full Image</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {request.status === 'pending' ? (
                      <div className="space-y-3 pt-2 border-t dark:border-gray-800">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rejection Notes (optional)</label>
                          <textarea
                            value={rejectNotes[request.id] || ''}
                            onChange={(e) => setRejectNotes(prev => ({
                              ...prev,
                              [request.id]: e.target.value
                            }))}
                            placeholder="Add notes if rejecting..."
                            className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="success"
                            onClick={() => handleApprove(request.id)}
                            icon={<Check size={18} />}
                            className="flex-1 font-bold"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="error"
                            onClick={() => handleReject(request.id)}
                            icon={<X size={18} />}
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
                          Date <span className="text-gray-900 dark:text-white font-bold">{new Date(request.reviewed_at).toLocaleString()}</span>
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
    </div>
  );
};
