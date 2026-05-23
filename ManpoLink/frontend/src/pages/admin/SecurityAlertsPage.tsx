import { useState, useMemo } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { AlertTriangle, Search, Filter, Clock, Shield, CheckCircle, X, Trash2 } from 'lucide-react';
import { useGetSecurityAlerts, useClearAllSecurityAlerts } from '@/hooks/useQueries';
import { useToast } from '@/hooks/useToast';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { formatDistanceToNow } from 'date-fns';
import { Sidebar } from '@/components/Sidebar';

export const SecurityAlertsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resolvedFilter, setResolvedFilter] = useState('unresolved');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data, isLoading } = useGetSecurityAlerts();
  const clearAllMutation = useClearAllSecurityAlerts();
  const { success, error: toastError } = useToast();
  const alerts = normalizeApiResponse(data) || [];

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all security alerts? This action cannot be undone.')) {
      try {
        await clearAllMutation.mutateAsync();
        success('All security alerts cleared successfully.');
      } catch (err) {
        toastError('Failed to clear security alerts.');
      }
    }
  };

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert: any) => {
      const matchesSearch =
        !searchTerm ||
        alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.details?.username?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = !severityFilter || alert.severity === severityFilter;
      const matchesType = !typeFilter || alert.alert_type === typeFilter;

      let matchesResolved = true;
      if (resolvedFilter === 'resolved') {
        matchesResolved = alert.is_resolved === true;
      } else if (resolvedFilter === 'unresolved') {
        matchesResolved = alert.is_resolved === false;
      }

      return matchesSearch && matchesSeverity && matchesType && matchesResolved;
    });
  }, [alerts, searchTerm, severityFilter, typeFilter, resolvedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAlerts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAlerts, currentPage]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(alerts.map((alert: any) => alert.alert_type));
    return Array.from(types).sort();
  }, [alerts]);

  const uniqueSeverities = ['critical', 'high', 'medium', 'low'];

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      'critical': 'error',
      'high': 'error',
      'medium': 'warning',
      'low': 'info',
    };
    return colors[severity] || 'default';
  };

  const getSeverityIcon = (severity: string) => {
    const iconClass = 'size-5';
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      case 'medium':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case 'low':
        return <AlertTriangle className={`${iconClass} text-blue-600`} />;
      default:
        return <Shield className={`${iconClass} text-gray-600`} />;
    }
  };

  const formatAlertType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const unresolvedCount = useMemo(
    () => alerts.filter((alert: any) => !alert.is_resolved).length,
    [alerts]
  );

  const criticalCount = useMemo(
    () => alerts.filter((alert: any) => alert.severity === 'critical' && !alert.is_resolved).length,
    [alerts]
  );

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
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Security Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Monitor and manage security events and suspicious activities
          </p>
        </div>
        
        {alerts.length > 0 && (
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
                Clear All Alerts
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-4 border-l-4 ${unresolvedCount > 0 ? 'border-red-500' : 'border-green-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Unresolved Alerts</p>
              <p className={`text-3xl font-bold ${unresolvedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {unresolvedCount}
              </p>
            </div>
            <Shield size={40} className={unresolvedCount > 0 ? 'text-red-100' : 'text-green-100'} />
          </div>
        </Card>

        <Card className={`p-4 border-l-4 border-purple-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Critical Alerts</p>
              <p className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {criticalCount}
              </p>
            </div>
            <AlertTriangle size={40} className="text-purple-100" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Alerts</p>
              <p className="text-3xl font-bold text-blue-600">{filteredAlerts.length}</p>
            </div>
            <Shield size={40} className="text-blue-100" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by message, employee, or username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field !pl-10 w-full py-2"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {formatAlertType(type)}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field"
          >
            <option value="">All Severities</option>
            {uniqueSeverities.map((severity) => (
              <option key={severity} value={severity}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </option>
            ))}
          </select>

          {/* Resolved Filter */}
          <select
            value={resolvedFilter}
            onChange={(e) => {
              setResolvedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field"
          >
            <option value="all">All Alerts</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </Card>

      {/* Security Alerts Table */}
      {paginatedAlerts.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 dark:bg-gray-950 text-white sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Severity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Message</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedAlerts.map((alert: any) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      alert.severity === 'critical' || alert.severity === 'high'
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity?.charAt(0).toUpperCase() + alert.severity?.slice(1)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="default">{formatAlertType(alert.alert_type)}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span title={alert.message} className="truncate block max-w-sm">
                        {alert.message}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400 flex-shrink-0" />
                        <span>
                          {new Date(alert.created_at).toLocaleString()}
                          <br />
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {alert.is_resolved ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          <span className="text-green-600 font-medium">Resolved</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <X size={18} className="text-red-600" />
                          <span className="text-red-600 font-medium">Unresolved</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {alert.details?.ip_address && (
                        <div className="text-xs">
                          <span className="font-semibold">IP:</span> {alert.details.ip_address}
                          {alert.details.failed_attempts && (
                            <div>
                              <span className="font-semibold">Attempts:</span> {alert.details.failed_attempts}
                            </div>
                          )}
                          {alert.details.username && (
                            <div>
                              <span className="font-semibold">User:</span> {alert.details.username}
                            </div>
                          )}
                        </div>
                      )}
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
                {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length}
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
          title="No security alerts found"
          description="All is secure! No alerts match your current filters."
        />
      )}
    </div>
  </div>
  );
};
