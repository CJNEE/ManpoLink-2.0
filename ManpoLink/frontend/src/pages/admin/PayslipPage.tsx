import { useState, useMemo } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { Sidebar } from '@/components/Sidebar';
import { PayslipDetailModal } from '@/components/PayslipDetailModal';
import { useGetPayroll, useGetHubs, useGetEmployees, useUpdatePayroll, useCreatePayroll } from '@/hooks/useQueries';
import { Download, Search, Shield, Edit2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

export const PayslipPage = () => {
  const { canEditPayroll, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sidebar should render even on desktop

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return day <= 15 ? `${y}-${pad(m + 1)}-01` : `${y}-${pad(m + 1)}-16`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (day <= 15) {
      return `${y}-${pad(m + 1)}-15`;
    } else {
      const lastDay = new Date(y, m + 1, 0).getDate();
      return `${y}-${pad(m + 1)}-${pad(lastDay)}`;
    }
  });
  const [year, setYear] = useState('All');
  const [hubFilter, setHubFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (!val) {
      setEndDate('');
      return;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return;
    
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    if (day <= 15) {
      setStartDate(`${y}-${pad(m + 1)}-01`);
      setEndDate(`${y}-${pad(m + 1)}-15`);
    } else {
      setStartDate(`${y}-${pad(m + 1)}-16`);
      const lastDay = new Date(y, m + 1, 0).getDate();
      setEndDate(`${y}-${pad(m + 1)}-${pad(lastDay)}`);
    }
  };

  // Fetch data
  const { data: payrollData, isLoading: payrollLoading } = useGetPayroll();
  const { data: hubsData, isLoading: hubsLoading } = useGetHubs();
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployees();
  
  const updatePayrollMutation = useUpdatePayroll();
  const createPayrollMutation = useCreatePayroll();

  const payroll = normalizeApiResponse(payrollData);

  
  const hubs = normalizeApiResponse(hubsData);
  const employees = normalizeApiResponse(employeesData);

  const formatPayrollPeriod = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return 'N/A';
    try {
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return `${startStr} - ${endStr}`;
      }
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const startMonth = monthNames[startDate.getMonth()];
      const startDay = startDate.getDate();
      const endMonth = monthNames[endDate.getMonth()];
      const endDay = endDate.getDate();
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      if (startMonth === endMonth && startYear === endYear) {
        if (startDay === endDay) {
          return `${startMonth} ${startDay}, ${startYear}`;
        }
        return `${startMonth} ${startDay} to ${endDay}, ${startYear}`;
      } else {
        return `${startMonth} ${startDay}, ${startYear} to ${endMonth} ${endDay}, ${endYear}`;
      }
    } catch (e) {
      return `${startStr} - ${endStr}`;
    }
  };

  const handleSave = async (updated?: any) => {
    try {
      setIsLoading(true);
      const payload = updated ?? selectedPayslip;
      if (!payload) {
        throw new Error('No payroll data provided');
      }
      if (payload.id) {
        // Try to update existing record
        try {
          const updatedPayroll = await updatePayrollMutation.mutateAsync({ id: payload.id, data: payload });
          setSelectedPayslip(updatedPayroll);
        } catch (updateErr: any) {
          if (updateErr?.response?.status === 404) {
            const created = await createPayrollMutation.mutateAsync(payload);
            setSelectedPayslip(created);
          } else {
            throw updateErr;
          }
        }
      } else {
        const created = await createPayrollMutation.mutateAsync(payload);
        setSelectedPayslip(created);
      }
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const approved = payroll.filter((p: any) => (p.status || '').toString().toLowerCase() === 'approved').length;
    const pending = payroll.filter((p: any) => (p.status || '').toString().toLowerCase() === 'pending' || (p.status || '').toString().toLowerCase() === 'processing').length;
    const drafts = payroll.filter((p: any) => (p.status || '').toString().toLowerCase() === 'draft').length;

    return {
      totalEmployees,
      approved,
      pending,
      drafts,
    };
  }, [payroll, employees]);

  // Get unique years from payroll data
  const years = useMemo(() => {
    const uniqueYears = new Set(
      payroll.map((p: any) => new Date(p.period_end || p.created_at).getFullYear().toString())
    );
    // Always include current and previous year
    const currentYear = new Date().getFullYear();
    uniqueYears.add(currentYear.toString());
    uniqueYears.add((currentYear - 1).toString());
    
    return ['All', ...Array.from(uniqueYears).sort().reverse()];
  }, [payroll]);

  // Group payroll by hub
  const payrollByHub = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};

    payroll.forEach((record: any) => {
      const hubName = record.hub || 'Unknown Hub';
      if (!grouped[hubName]) {
        grouped[hubName] = [];
      }

      // Filter based on search and filters
      const matchesSearch =
        !searchTerm ||
        record.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.jtp_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesHub = hubFilter === 'All' || record.hub === hubFilter || record.hub_name === hubFilter;
      const matchesStatus =
        statusFilter === 'All' || record.status === statusFilter;
      const matchesYear =
        year === 'All' || new Date(record.period_end || record.created_at).getFullYear().toString() === year;
      
      const matchesDate = 
        (!startDate || new Date(record.period_start) >= new Date(startDate)) &&
        (!endDate || new Date(record.period_end) <= new Date(endDate));

      if (matchesSearch && matchesHub && matchesStatus && matchesYear && matchesDate) {
        grouped[hubName].push(record);
      }
    });

    return grouped;
  }, [payroll, searchTerm, hubFilter, statusFilter, year, startDate, endDate]);

  const handleDownload = (hubName: string) => {
    const hubData = payrollByHub[hubName];
    if (!hubData || hubData.length === 0) {
      alert('No data to download for this hub');
      return;
    }

    // Prepare CSV data with all detailed fields
    const headers = [
      'Fullname', 'JTP Code', 'Hub', 'Period Start', 'Period End',
      'Total Hours', 'Overtime Hours', 'Lates (Count)', 'Absences (Count)',
      'Basic Salary', 'Standard Pay', 'Overtime Pay', 'Night Differential', 'NDOT',
      'Rest Day', 'Rest Day OT', 'Rest Day ND', 'Rest Day NDOT',
      'Special Holiday', 'Special Holiday OT', 'Special Holiday ND', 'Special Holiday NDOT',
      'Legal Holiday', 'Legal Holiday OT', 'Legal Holiday ND', 'Legal Holiday NDOT',
      'Legal Holiday RD', 'Legal Holiday RDOT', 'Legal Holiday RDND', 'Legal Holiday RDNDOT',
      'Incentives', 'Adjustment', 'Gas', 'Load', 'Other Allowance', 'Rewards Adjustments', 'KPI', 'Allowances (Legacy)',
      'Total Earnings',
      'Late Deduction', 'ID Deduction', 'Uniform', 'Insurance', 'Surety Bond', 'Convenience Fee', 'General Deduction',
      'SSS Deduction', 'Philhealth Deduction', 'Pagibig Deduction',
      'Other Deductions (Details sum)', 'Total Deductions',
      'Net Pay', 'Status'
    ];

    const rows = hubData.map((record: any) => {
      // Calculate earnings total if not provided
      const totalEarnings = record.total_earnings || (
        parseFloat(record.basic_salary || '0') + parseFloat(record.standard_pay || '0') + parseFloat(record.overtime_pay || '0') +
        parseFloat(record.night_differential || '0') + parseFloat(record.ndot || '0') +
        parseFloat(record.rest_day || '0') + parseFloat(record.rest_day_ot || '0') + parseFloat(record.rest_day_nd || '0') + parseFloat(record.rest_day_ndot || '0') +
        parseFloat(record.special_holiday || '0') + parseFloat(record.special_holiday_ot || '0') + parseFloat(record.special_holiday_nd || '0') + parseFloat(record.special_holiday_ndot || '0') +
        parseFloat(record.legal_holiday || '0') + parseFloat(record.legal_holiday_ot || '0') + parseFloat(record.legal_holiday_nd || '0') + parseFloat(record.legal_holiday_ndot || '0') +
        parseFloat(record.legal_holiday_rd || '0') + parseFloat(record.legal_holiday_rdot || '0') + parseFloat(record.legal_holiday_rdnd || '0') + parseFloat(record.legal_holiday_rdndot || '0') +
        parseFloat(record.incentives || '0') + parseFloat(record.adjustment || '0') + parseFloat(record.gas || '0') + parseFloat(record.load || '0') +
        parseFloat(record.other_allowance || '0') + parseFloat(record.rewards_adjustments || '0') + parseFloat(record.kpi || '0') + parseFloat(record.allowances || '0')
      );

      // Calculate other deductions from deduction_details
      let sumOther = 0;
      if (record.deduction_details) {
        if (typeof record.deduction_details === 'object' && !Array.isArray(record.deduction_details)) {
          sumOther = Object.values(record.deduction_details).reduce((acc: number, val: any) => acc + (parseFloat(val) || 0), 0);
        } else if (Array.isArray(record.deduction_details)) {
          sumOther = record.deduction_details.reduce((acc: number, val: any) => acc + (parseFloat(val) || 0), 0);
        }
      }

      const totalDed = (
        parseFloat(record.late || '0') + parseFloat(record.id_deduction || '0') + parseFloat(record.uniform || '0') +
        parseFloat(record.insurance || '0') + parseFloat(record.surety_bond || '0') + parseFloat(record.convenience_fee || '0') +
        parseFloat(record.general_deduction || '0') + parseFloat(record.sss_deduction || '0') + parseFloat(record.philhealth_deduction || '0') +
        parseFloat(record.pagibig_deduction || '0') + sumOther
      );
      
      return [
        record.fullname || record.full_name || 'N/A',
        record.jtp_code || 'N/A',
        record.hub || record.hub_name || 'N/A',
        record.period_start || '',
        record.period_end || '',
        record.total_hours || '0',
        record.overtime_hours || '0',
        record.lates || '0',
        record.absences || '0',
        record.basic_salary || '0',
        record.standard_pay || '0',
        record.overtime_pay || '0',
        record.night_differential || '0',
        record.ndot || '0',
        record.rest_day || '0',
        record.rest_day_ot || '0',
        record.rest_day_nd || '0',
        record.rest_day_ndot || '0',
        record.special_holiday || '0',
        record.special_holiday_ot || '0',
        record.special_holiday_nd || '0',
        record.special_holiday_ndot || '0',
        record.legal_holiday || '0',
        record.legal_holiday_ot || '0',
        record.legal_holiday_nd || '0',
        record.legal_holiday_ndot || '0',
        record.legal_holiday_rd || '0',
        record.legal_holiday_rdot || '0',
        record.legal_holiday_rdnd || '0',
        record.legal_holiday_rdndot || '0',
        record.incentives || '0',
        record.adjustment || '0',
        record.gas || '0',
        record.load || '0',
        record.other_allowance || '0',
        record.rewards_adjustments || '0',
        record.kpi || '0',
        record.allowances || '0',
        totalEarnings.toFixed(2),
        record.late || '0',
        record.id_deduction || '0',
        record.uniform || '0',
        record.insurance || '0',
        record.surety_bond || '0',
        record.convenience_fee || '0',
        record.general_deduction || '0',
        record.sss_deduction || '0',
        record.philhealth_deduction || '0',
        record.pagibig_deduction || '0',
        sumOther.toFixed(2),
        totalDed.toFixed(2),
        record.net_pay || '0.00',
        record.status || 'N/A',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hubName}-detailed-payroll-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'present':
        return 'success';
      case 'pending':
      case 'absent':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'info';
    }
  };

  if (payrollLoading || hubsLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div />
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
        <div>
          <h1 className="text-3xl font-bold mb-2">Payroll Management</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage employee payrolls by hub</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-orange-500">
            <div className="text-center">
              <p className="text-orange-600 font-semibold text-sm">Total Employees</p>
              <p className="text-5xl font-bold text-orange-600 mt-3">{stats.totalEmployees}</p>
            </div>
          </Card>
          <Card className="border-l-4 border-green-500">
            <div className="text-center">
              <p className="text-green-600 font-semibold text-sm">Approved</p>
              <p className="text-5xl font-bold text-green-600 mt-3">{stats.approved}</p>
            </div>
          </Card>
          <Card className="border-l-4 border-yellow-600">
            <div className="text-center">
              <p className="text-yellow-600 font-semibold text-sm">Pending</p>
              <p className="text-5xl font-bold text-yellow-600 mt-3">{stats.pending}</p>
            </div>
          </Card>
          <Card className="border-l-4 border-red-600">
            <div className="text-center">
              <p className="text-red-600 font-semibold text-sm">Drafts</p>
              <p className="text-5xl font-bold text-red-600 mt-3">{stats.drafts}</p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="input-field w-full" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">End Date (auto)</label>
              <input type="date" value={endDate} readOnly className="input-field w-full bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter by year" className="input-field w-full">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Hub Name</label>
              <select value={hubFilter} onChange={(e) => setHubFilter(e.target.value)} aria-label="Filter by hub name" className="input-field w-full">
                <option value="All">All Hubs</option>
                {hubs.map((hub: any) => <option key={hub.id} value={hub.name}>{hub.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="input-field w-full">
                <option value="All">All Status</option>
                {isAdmin ? (
                  <><option value="approved">Approved</option><option value="pending">Pending</option><option value="draft">Draft</option></>
                ) : (
                  <><option value="approved">Approved</option><option value="present">Present</option><option value="pending">Pending</option><option value="absent">Absent</option><option value="rejected">Rejected</option></>
                )}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Search Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="text" placeholder="Search user here..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field !pl-10 w-full" />
              </div>
            </div>
          </div>
        </Card>

        {Object.keys(payrollByHub).length > 0 ? (
          Object.entries(payrollByHub).map(([hubName, records]) => (
            <Card key={hubName}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-red-700">Payroll List</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">{hubName}</div>
              </div>
              {records.length > 0 ? (
                <>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Fullname</th>
                          <th className="px-4 py-3 text-left font-semibold">JTP Code</th>
                          <th className="px-4 py-3 text-left font-semibold">Hub</th>
                          <th className="px-4 py-3 text-left font-semibold">Net Pay</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-center font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record: any, idx: number) => (
                          <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 font-medium">{record.fullname || 'N/A'}</td>
                            <td className="px-4 py-3">{record.jtp_code || 'N/A'}</td>
                            <td className="px-4 py-3">{record.hub || hubName}</td>
                            <td className="px-4 py-3">₱{parseFloat(record.net_pay || '0').toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <Badge variant={getStatusBadgeVariant(record.status)}>{record.status || 'N/A'}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-row flex-wrap gap-2 justify-center items-center">
                                <button onClick={() => { setSelectedPayslip(record); setIsModalOpen(true); }} className="btn btn-primary !py-1.5 !px-3 text-xs">View</button>

                                <button onClick={() => handleDownload(hubName)} className="btn btn-secondary !py-1.5 !px-3 text-xs">Download</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No records found for this hub.
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState
              title="No data available"
              description="No payroll records match your filters. Try adjusting your search criteria."
            />
          </Card>
        )}

        {/* Payslip Detail Modal */}
        <PayslipDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayslip(null);
          }}
          payslip={selectedPayslip}
          allPayroll={payroll}
          onSave={(updatedPayslip: any) => {
            console.log('Updated Payslip:', updatedPayslip);
            // Add logic to update the payslip in the backend or state
          }}
        />
      </div>
    </div>
  );
};

