import { useState, useMemo } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { Activity, Filter, Search, Clock, User, FileText, Trash2 } from 'lucide-react';
import { useGetActivityLogs, useClearAllActivityLogs } from '@/hooks/useQueries';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { formatDistanceToNow } from 'date-fns';
import { Sidebar } from '@/components/Sidebar';
import { useToast } from '@/hooks/useToast';

export const ActivityLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data, isLoading } = useGetActivityLogs();
  const clearAllMutation = useClearAllActivityLogs();
  const { success, error: toastError } = useToast();
  const activityLogs = normalizeApiResponse(data) || [];

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
      try {
        await clearAllMutation.mutateAsync();
        success('All activity logs cleared successfully.');
      } catch (err) {
        toastError('Failed to clear activity logs.');
      }
    }
  };

  // Filter activities
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log: any) => {
      const matchesSearch =
        !searchTerm ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = !actionFilter || log.action === actionFilter;
      const matchesRole = !roleFilter || log.role === roleFilter;

      return matchesSearch && matchesAction && matchesRole;
    });
  }, [activityLogs, searchTerm, actionFilter, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(activityLogs.map((log: any) => log.action));
    return Array.from(actions).sort();
  }, [activityLogs]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(activityLogs.map((log: any) => log.role));
    return Array.from(roles).sort();
  }, [activityLogs]);

  const getActionColor = (action: string): string => {
    const actionColors: Record<string, string> = {
      'login': 'success',
      'logout': 'warning',
      'failed_login': 'error',
      'create_employee': 'info',
      'update_employee': 'warning',
      'delete_employee': 'error',
      'approve_request': 'success',
      'reject_request': 'error',
      'clock_in': 'success',
      'clock_out': 'warning',
      'reset_password': 'warning',
      'blacklist': 'error',
      'employee_deleted': 'error',
      'toggle_edit_permission': 'warning',
      'submit_edit_request': 'info',
      'submit_leave_request': 'info',
      'bulk_toggle_login': 'warning',
      'approve_payslip': 'success',
      'update_payslip': 'warning',
    };
    return actionColors[action] || 'default';
  };

  const formatAction = (action: string): string => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Activity size={28} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Track all user activities and system events
          </p>
        </div>
        
        {activityLogs.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearAllMutation.isPending}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
          >
            {clearAllMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Trash2 size={16} />
                Clear All Logs
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Activities</p>
              <p className="text-3xl font-bold text-blue-600">{filteredLogs.length}</p>
            </div>
            <Activity size={40} className="text-blue-100 dark:text-blue-900/30" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Unique Actions</p>
              <p className="text-3xl font-bold text-green-600">{uniqueActions.length}</p>
            </div>
            <FileText size={40} className="text-green-100 dark:text-green-900/30" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Roles</p>
              <p className="text-3xl font-bold text-purple-600">{uniqueRoles.length}</p>
            </div>
            <User size={40} className="text-purple-100 dark:text-purple-900/30" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by details, user, or employee..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field !pl-10 w-full py-2"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field"
          >
            <option value="">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Activity Logs Table */}
      {paginatedLogs.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 dark:bg-gray-950 text-white sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedLogs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400 flex-shrink-0" />
                        <span>
                          {new Date(log.created_at).toLocaleString()}
                          <br />
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {log.user?.username || 'System'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        variant={
                          log.role === 'Admin'
                            ? 'error'
                            : log.role === 'HR'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {log.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getActionColor(log.action)}>
                        {formatAction(log.action)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span title={log.details} className="truncate block max-w-xs">
                        {log.details}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center px-3 py-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          title="No activity logs found"
          description="Try adjusting your filters or check back later for new activities"
        />
      )}
       </div>
  </div>
  );
};