import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useToast } from '@/hooks/useToast';
import { useUpdatePayroll, useCreatePayroll } from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';
import { 
  Download, 
  Edit2, 
  Check, 
  DollarSign, 
  Calendar, 
  User, 
  Clock, 
  ShieldAlert, 
  Percent, 
  Award, 
  Briefcase, 
  ChevronRight 
} from 'lucide-react';

type PayslipStatus = 'draft' | 'approved' | 'pending' | string;

type Payslip = {
  id?: number;
  standard_pay?: number | string;
  basic_salary?: number | string;
  overtime_pay?: number | string;
  night_differential?: number | string;
  ndot?: number | string;
  rest_day?: number | string;
  rest_day_ot?: number | string;
  rest_day_nd?: number | string;
  rest_day_ndot?: number | string;
  special_holiday?: number | string;
  special_holiday_ot?: number | string;
  special_holiday_nd?: number | string;
  special_holiday_ndot?: number | string;
  legal_holiday?: number | string;
  legal_holiday_ot?: number | string;
  legal_holiday_nd?: number | string;
  legal_holiday_ndot?: number | string;
  legal_holiday_rd?: number | string;
  legal_holiday_rdot?: number | string;
  legal_holiday_rdnd?: number | string;
  legal_holiday_rdndot?: number | string;
  incentives?: number | string;
  adjustment?: number | string;
  gas?: number | string;
  load?: number | string;
  other_allowance?: number | string;
  rewards_adjustments?: number | string;
  kpi?: number | string;
  allowances?: number | string;

  late?: number | string;
  id_deduction?: number | string;
  uniform?: number | string;
  insurance?: number | string;
  surety_bond?: number | string;
  convenience_fee?: number | string;
  general_deduction?: number | string;

  sss_deduction?: number | string;
  philhealth_deduction?: number | string;
  pagibig_deduction?: number | string;
  deduction_details?: Record<string, number>;
  total_deductions?: number | string;
  total_government_deductions?: number | string;
  total_earnings?: number | string;
  status?: PayslipStatus;

  total_hours?: number | string;
  overtime_hours?: number | string;
  lates?: number | string;
  absences?: number | string;
  totalHours?: number | string;
  sss_percent?: number | string;
  philhealth_percent?: number | string;
  pagibig_percent?: number | string;

  profile_image_url?: string;
  profile_image?: string;
  full_name?: string;
  fullname?: string;
  jtp_code?: string;
  position?: string;
  date_hired?: string;
  hub_name?: string;
  hub?: string;
  payslip_period?: string;
  period_start?: string;
  period_end?: string;
  employee?: number | string;
  employee_id?: number | string;
  tin?: string;
  sss_no?: string;
  philhealth_no?: string;
  pagibig_no?: string;
  net_pay?: number | string;
};

interface PayslipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: Payslip | null;
  allPayroll?: Payslip[];
  onSave?: (updatedPayslip: Payslip) => void;
}

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatPayslipPeriod = (startStr?: string, endStr?: string) => {
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

const get15DayRange = (startDateStr: string): { start: string; end: string } => {
  if (!startDateStr) return { start: '', end: '' };
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return { start: startDateStr, end: startDateStr };
  
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (day <= 15) {
    // Range is 1st to 15th
    const start = `${year}-${pad(month + 1)}-01`;
    const end = `${year}-${pad(month + 1)}-15`;
    return { start, end };
  } else {
    // Range is 16th to end of month
    const start = `${year}-${pad(month + 1)}-16`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    return { start, end };
  }
};

export const PayslipDetailModal = ({
  isOpen,
  onClose,
  payslip,
  allPayroll = [],
  onSave,
}: PayslipDetailModalProps) => {
  const { success, error } = useToast();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPayslip, setLocalPayslip] = useState<Payslip | null>(payslip);
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');

  const history = (allPayroll || []).filter(p => {
    if (!payslip) return false;
    const pEmpId = p.employee || p.employee_id;
    const currentEmpId = payslip.employee || payslip.employee_id;
    return pEmpId && currentEmpId && pEmpId === currentEmpId && p.id !== localPayslip?.id;
  }).sort((a, b) => new Date(b.period_end || '').getTime() - new Date(a.period_end || '').getTime());

  const [formData, setFormData] = useState({
    standard_pay: toNumber(payslip?.standard_pay ?? 0),
    basic_salary: toNumber(payslip?.basic_salary ?? 0),
    overtime_pay: toNumber(payslip?.overtime_pay ?? 0),
    night_differential: toNumber(payslip?.night_differential ?? 0),
    ndot: toNumber(payslip?.ndot ?? 0),
    rest_day: toNumber(payslip?.rest_day ?? 0),
    rest_day_ot: toNumber(payslip?.rest_day_ot ?? 0),
    rest_day_nd: toNumber(payslip?.rest_day_nd ?? 0),
    rest_day_ndot: toNumber(payslip?.rest_day_ndot ?? 0),
    special_holiday: toNumber(payslip?.special_holiday ?? 0),
    special_holiday_ot: toNumber(payslip?.special_holiday_ot ?? 0),
    special_holiday_nd: toNumber(payslip?.special_holiday_nd ?? 0),
    special_holiday_ndot: toNumber(payslip?.special_holiday_ndot ?? 0),
    legal_holiday: toNumber(payslip?.legal_holiday ?? 0),
    legal_holiday_ot: toNumber(payslip?.legal_holiday_ot ?? 0),
    legal_holiday_nd: toNumber(payslip?.legal_holiday_nd ?? 0),
    legal_holiday_ndot: toNumber(payslip?.legal_holiday_ndot ?? 0),
    legal_holiday_rd: toNumber(payslip?.legal_holiday_rd ?? 0),
    legal_holiday_rdot: toNumber(payslip?.legal_holiday_rdot ?? 0),
    legal_holiday_rdnd: toNumber(payslip?.legal_holiday_rdnd ?? 0),
    legal_holiday_rdndot: toNumber(payslip?.legal_holiday_rdndot ?? 0),
    incentives: toNumber(payslip?.incentives ?? 0),
    adjustment: toNumber(payslip?.adjustment ?? 0),
    gas: toNumber(payslip?.gas ?? 0),
    load: toNumber(payslip?.load ?? 0),
    other_allowance: toNumber(payslip?.other_allowance ?? 0),
    rewards_adjustments: toNumber(payslip?.rewards_adjustments ?? 0),
    kpi: toNumber(payslip?.kpi ?? 0),
    allowances: toNumber(payslip?.allowances ?? 0),

    late: toNumber(payslip?.late ?? 0),
    id_deduction: toNumber(payslip?.id_deduction ?? 0),
    uniform: toNumber(payslip?.uniform ?? 0),
    insurance: toNumber(payslip?.insurance ?? 0),
    surety_bond: toNumber(payslip?.surety_bond ?? 0),
    convenience_fee: toNumber(payslip?.convenience_fee ?? 0),
    general_deduction: toNumber(payslip?.general_deduction ?? 0),
    status: (payslip?.status as PayslipStatus) || 'draft',
  });

  const [govPercents, setGovPercents] = useState({
    sss: toNumber((payslip as any)?.sss_percent ?? (localPayslip as any)?.sss_percent ?? 0),
    philhealth: toNumber((payslip as any)?.philhealth_percent ?? (localPayslip as any)?.philhealth_percent ?? 0),
    pagibig: toNumber((payslip as any)?.pagibig_percent ?? (localPayslip as any)?.pagibig_percent ?? 0),
  });

  const updatePayrollMutation = useUpdatePayroll();
  const createPayrollMutation = useCreatePayroll();

  useEffect(() => {
    setLocalPayslip(payslip);
    setFormData({
      standard_pay: toNumber(payslip?.standard_pay ?? 0),
      basic_salary: toNumber(payslip?.basic_salary ?? 0),
      overtime_pay: toNumber(payslip?.overtime_pay ?? 0),
      night_differential: toNumber(payslip?.night_differential ?? 0),
      ndot: toNumber(payslip?.ndot ?? 0),
      rest_day: toNumber(payslip?.rest_day ?? 0),
      rest_day_ot: toNumber(payslip?.rest_day_ot ?? 0),
      rest_day_nd: toNumber(payslip?.rest_day_nd ?? 0),
      rest_day_ndot: toNumber(payslip?.rest_day_ndot ?? 0),
      special_holiday: toNumber(payslip?.special_holiday ?? 0),
      special_holiday_ot: toNumber(payslip?.special_holiday_ot ?? 0),
      special_holiday_nd: toNumber(payslip?.special_holiday_nd ?? 0),
      special_holiday_ndot: toNumber(payslip?.special_holiday_ndot ?? 0),
      legal_holiday: toNumber(payslip?.legal_holiday ?? 0),
      legal_holiday_ot: toNumber(payslip?.legal_holiday_ot ?? 0),
      legal_holiday_nd: toNumber(payslip?.legal_holiday_nd ?? 0),
      legal_holiday_ndot: toNumber(payslip?.legal_holiday_ndot ?? 0),
      legal_holiday_rd: toNumber(payslip?.legal_holiday_rd ?? 0),
      legal_holiday_rdot: toNumber(payslip?.legal_holiday_rdot ?? 0),
      legal_holiday_rdnd: toNumber(payslip?.legal_holiday_rdnd ?? 0),
      legal_holiday_rdndot: toNumber(payslip?.legal_holiday_rdndot ?? 0),
      incentives: toNumber(payslip?.incentives ?? 0),
      adjustment: toNumber(payslip?.adjustment ?? 0),
      gas: toNumber(payslip?.gas ?? 0),
      load: toNumber(payslip?.load ?? 0),
      other_allowance: toNumber(payslip?.other_allowance ?? 0),
      rewards_adjustments: toNumber(payslip?.rewards_adjustments ?? 0),
      kpi: toNumber(payslip?.kpi ?? 0),
      allowances: toNumber(payslip?.allowances ?? 0),

      late: toNumber(payslip?.late ?? 0),
      id_deduction: toNumber(payslip?.id_deduction ?? 0),
      uniform: toNumber(payslip?.uniform ?? 0),
      insurance: toNumber(payslip?.insurance ?? 0),
      surety_bond: toNumber(payslip?.surety_bond ?? 0),
      convenience_fee: toNumber(payslip?.convenience_fee ?? 0),
      general_deduction: toNumber(payslip?.general_deduction ?? 0),
      status: (payslip?.status as PayslipStatus) || 'draft',
    });
    setIsEditMode(false);
    setGovPercents({
      sss: toNumber((payslip as any)?.sss_percent ?? (localPayslip as any)?.sss_percent ?? 0),
      philhealth: toNumber((payslip as any)?.philhealth_percent ?? (localPayslip as any)?.philhealth_percent ?? 0),
      pagibig: toNumber((payslip as any)?.pagibig_percent ?? (localPayslip as any)?.pagibig_percent ?? 0),
    });
    setPeriodStart(payslip?.period_start || '');
    setPeriodEnd(payslip?.period_end || '');
  }, [payslip]);

  const fetchComputed = async (start: string, end: string) => {
    const employee = (payslip as any)?.employee ?? (payslip as any)?.employee_id ?? (localPayslip as any)?.employee;
    if (!employee || !start || !end) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('employee_id', String(typeof employee === 'object' ? (employee as any).id : employee));
      params.set('period_start', start);
      params.set('period_end', end);
      
      params.set('standard_pay', String(toNumber(formData.standard_pay)));
      params.set('basic_salary', String(toNumber(formData.basic_salary)));
      params.set('overtime_pay', String(toNumber(formData.basic_salary) * 0.25));
      params.set('night_differential', String(toNumber(formData.night_differential)));
      params.set('ndot', String(toNumber(formData.ndot)));
      params.set('rest_day', String(toNumber(formData.rest_day)));
      params.set('rest_day_ot', String(toNumber(formData.rest_day_ot)));
      params.set('rest_day_nd', String(toNumber(formData.rest_day_nd)));
      params.set('rest_day_ndot', String(toNumber(formData.rest_day_ndot)));
      params.set('special_holiday', String(toNumber(formData.special_holiday)));
      params.set('special_holiday_ot', String(toNumber(formData.special_holiday_ot)));
      params.set('special_holiday_nd', String(toNumber(formData.special_holiday_nd)));
      params.set('special_holiday_ndot', String(toNumber(formData.special_holiday_ndot)));
      params.set('legal_holiday', String(toNumber(formData.legal_holiday)));
      params.set('legal_holiday_ot', String(toNumber(formData.legal_holiday_ot)));
      params.set('legal_holiday_nd', String(toNumber(formData.legal_holiday_nd)));
      params.set('legal_holiday_ndot', String(toNumber(formData.legal_holiday_ndot)));
      params.set('legal_holiday_rd', String(toNumber(formData.legal_holiday_rd)));
      params.set('legal_holiday_rdot', String(toNumber(formData.legal_holiday_rdot)));
      params.set('legal_holiday_rdnd', String(toNumber(formData.legal_holiday_rdnd)));
      params.set('legal_holiday_rdndot', String(toNumber(formData.legal_holiday_rdndot)));
      params.set('incentives', String(toNumber(formData.incentives)));
      params.set('adjustment', String(toNumber(formData.adjustment)));
      params.set('gas', String(toNumber(formData.gas)));
      params.set('load', String(toNumber(formData.load)));
      params.set('other_allowance', String(toNumber(formData.other_allowance)));
      params.set('rewards_adjustments', String(toNumber(formData.rewards_adjustments)));
      params.set('kpi', String(toNumber(formData.kpi)));
      params.set('allowances', String(toNumber(formData.allowances)));

      params.set('late', String(toNumber(formData.late)));
      params.set('id_deduction', String(toNumber(formData.id_deduction)));
      params.set('uniform', String(toNumber(formData.uniform)));
      params.set('insurance', String(toNumber(formData.insurance)));
      params.set('surety_bond', String(toNumber(formData.surety_bond)));
      params.set('convenience_fee', String(toNumber(formData.convenience_fee)));
      params.set('general_deduction', String(toNumber(formData.general_deduction)));

      const res = await fetch(`/api/payroll/compute/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!res.ok) throw new Error('Failed to compute payroll');
      const data = await res.json();
      setLocalPayslip((p) => ({ ...(p as any), ...data } as Payslip));
      setGovPercents({
        sss: toNumber(data.sss_percent ?? 0),
        philhealth: toNumber(data.philhealth_percent ?? 0),
        pagibig: toNumber(data.pagibig_percent ?? 0),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (payslip && payslip.id) return;

    const start = payslip?.period_start || localPayslip?.period_start || periodStart;
    const end = payslip?.period_end || localPayslip?.period_end || periodEnd;
    if (start && end) {
      fetchComputed(start, end);
    }
  }, [isOpen, payslip]);

  const handlePeriodStartChange = (val: string) => {
    setPeriodStart(val);
    const range = get15DayRange(val);
    if (range.end) {
      setPeriodEnd(range.end);
      fetchComputed(val, range.end);
    }
  };

  const handlePeriodEndChange = (val: string) => {
    setPeriodEnd(val);
    fetchComputed(periodStart, val);
  };

  const handleSave = async () => {
    const payload = {
      standard_pay: toNumber(formData.standard_pay),
      basic_salary: toNumber(formData.basic_salary),
      overtime_pay: toNumber(formData.basic_salary) * 0.25,
      night_differential: toNumber(formData.night_differential),
      ndot: toNumber(formData.ndot),
      rest_day: toNumber(formData.rest_day),
      rest_day_ot: toNumber(formData.rest_day_ot),
      rest_day_nd: toNumber(formData.rest_day_nd),
      rest_day_ndot: toNumber(formData.rest_day_ndot),
      special_holiday: toNumber(formData.special_holiday),
      special_holiday_ot: toNumber(formData.special_holiday_ot),
      special_holiday_nd: toNumber(formData.special_holiday_nd),
      special_holiday_ndot: toNumber(formData.special_holiday_ndot),
      legal_holiday: toNumber(formData.legal_holiday),
      legal_holiday_ot: toNumber(formData.legal_holiday_ot),
      legal_holiday_nd: toNumber(formData.legal_holiday_nd),
      legal_holiday_ndot: toNumber(formData.legal_holiday_ndot),
      legal_holiday_rd: toNumber(formData.legal_holiday_rd),
      legal_holiday_rdot: toNumber(formData.legal_holiday_rdot),
      legal_holiday_rdnd: toNumber(formData.legal_holiday_rdnd),
      legal_holiday_rdndot: toNumber(formData.legal_holiday_rdndot),
      incentives: toNumber(formData.incentives),
      adjustment: toNumber(formData.adjustment),
      gas: toNumber(formData.gas),
      load: toNumber(formData.load),
      other_allowance: toNumber(formData.other_allowance),
      rewards_adjustments: toNumber(formData.rewards_adjustments),
      kpi: toNumber(formData.kpi),
      allowances: toNumber(formData.allowances),

      late: toNumber(formData.late),
      id_deduction: toNumber(formData.id_deduction),
      uniform: toNumber(formData.uniform),
      insurance: toNumber(formData.insurance),
      surety_bond: toNumber(formData.surety_bond),
      convenience_fee: toNumber(formData.convenience_fee),
      general_deduction: toNumber(formData.general_deduction),

      deduction_details: localPayslip?.deduction_details ?? {},
      sss_percent: govPercents.sss,
      philhealth_percent: govPercents.philhealth,
      pagibig_percent: govPercents.pagibig,
      status: formData.status,
      period_start: periodStart,
      period_end: periodEnd,
    };

    const performCreate = async () => {
      const maybeEmployee = (localPayslip as any)?.employee ?? (localPayslip as any)?.employee_id ?? (payslip as any)?.employee ?? (payslip as any)?.employee_id;
      let employeeId: number | null = null;
      if (typeof maybeEmployee === 'number') employeeId = maybeEmployee;
      else if (typeof maybeEmployee === 'string' && /^\d+$/.test(maybeEmployee)) employeeId = parseInt(maybeEmployee, 10);
      else if (maybeEmployee && typeof maybeEmployee === 'object' && (maybeEmployee as any).id) employeeId = (maybeEmployee as any).id;

      if (!employeeId) {
        throw new Error('Missing employee id for creating payroll');
      }

      const createPayload = { ...payload, employee: employeeId } as any;

      const todayISO = new Date().toISOString().slice(0, 10);
      createPayload.period_start = periodStart || todayISO;
      createPayload.period_end = periodEnd || todayISO;

      if (!createPayload.deduction_details) createPayload.deduction_details = {};

      const created = await createPayrollMutation.mutateAsync(createPayload);
      setLocalPayslip(created);
      setIsEditMode(false);
      success('Payroll created successfully');
      onSave?.(created);
    };

    try {
      setIsLoading(true);

      if (payslip?.id) {
        try {
          const updated = await updatePayrollMutation.mutateAsync({ id: payslip.id, data: payload });
          setLocalPayslip(updated);
          setIsEditMode(false);
          success('Payroll updated successfully');
          onSave?.(updated);
        } catch (updateErr: any) {
          if (updateErr?.response?.status === 404) {
            // Fallback to create if not found
            await performCreate();
          } else {
            throw updateErr;
          }
        }
      } else {
        await performCreate();
      }
    } catch (err: unknown) {
      const axiosErr = err as any;
      error(axiosErr?.response?.data?.detail || axiosErr?.message || 'Failed to save payroll');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!localPayslip) return;
    try {
      const headers = [
        'Fullname', 'JTP Code', 'Position', 'Hub', 'Period',
        'Total Hours', 'Overtime Hours', 'Lates', 'Absences',
        'Basic Pay', 'Overtime Pay', 'Total Earnings', 'SSS Deduction',
        'Philhealth Deduction', 'Pagibig Deduction', 'Total Deductions', 'Net Pay', 'Status'
      ];

      const govDeductions = toNumber(localPayslip.sss_deduction) + toNumber(localPayslip.philhealth_deduction) + toNumber(localPayslip.pagibig_deduction);
      const otherDeductions = toNumber(localPayslip.total_deductions);
      const totalDed = govDeductions + otherDeductions;
      const netPay = toNumber(localPayslip.total_earnings) - totalDed;

      const row = [
        localPayslip.full_name || localPayslip.fullname || 'N/A',
        localPayslip.jtp_code || 'N/A',
        localPayslip.position || 'N/A',
        localPayslip.hub_name || localPayslip.hub || 'N/A',
        localPayslip.payslip_period || `${localPayslip.period_start} - ${localPayslip.period_end}`,
        localPayslip.total_hours || '0',
        localPayslip.overtime_hours || '0',
        localPayslip.lates || '0',
        localPayslip.absences || '0',
        localPayslip.basic_salary || '0',
        localPayslip.overtime_pay || '0',
        localPayslip.total_earnings || '0',
        localPayslip.sss_deduction || '0',
        localPayslip.philhealth_deduction || '0',
        localPayslip.pagibig_deduction || '0',
        otherDeductions,
        totalDed,
        netPay.toFixed(2),
        localPayslip.status || 'N/A'
      ];

      const csvContent = [
        headers.join(','),
        row.map(cell => `"${cell}"`).join(',')
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payroll-${localPayslip.full_name || 'Employee'}-${localPayslip.period_end}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      success('Payroll downloaded successfully');
    } catch (err) {
      console.error(err);
      error('Failed to download payroll');
    }
  };

  // Recompute government deductions and totals when earnings or govPercents change
  useEffect(() => {
    const otCalculated = toNumber(formData.basic_salary) * 0.25;

    const totalEarnings =
      toNumber(formData.standard_pay) +
      toNumber(formData.basic_salary) +
      otCalculated +
      toNumber(formData.night_differential) +
      toNumber(formData.ndot) +
      toNumber(formData.rest_day) +
      toNumber(formData.rest_day_ot) +
      toNumber(formData.rest_day_nd) +
      toNumber(formData.rest_day_ndot) +
      toNumber(formData.special_holiday) +
      toNumber(formData.special_holiday_ot) +
      toNumber(formData.special_holiday_nd) +
      toNumber(formData.special_holiday_ndot) +
      toNumber(formData.legal_holiday) +
      toNumber(formData.legal_holiday_ot) +
      toNumber(formData.legal_holiday_nd) +
      toNumber(formData.legal_holiday_ndot) +
      toNumber(formData.legal_holiday_rd) +
      toNumber(formData.legal_holiday_rdot) +
      toNumber(formData.legal_holiday_rdnd) +
      toNumber(formData.legal_holiday_rdndot) +
      toNumber(formData.incentives) +
      toNumber(formData.adjustment) +
      toNumber(formData.gas) +
      toNumber(formData.load) +
      toNumber(formData.other_allowance) +
      toNumber(formData.rewards_adjustments) +
      toNumber(formData.kpi) +
      toNumber(formData.allowances);

    const sssDed = (govPercents.sss / 100) * totalEarnings;
    const philDed = (govPercents.philhealth / 100) * totalEarnings;
    const pagibigDed = (govPercents.pagibig / 100) * totalEarnings;

    const govTotal = sssDed + philDed + pagibigDed;
    
    const otherItemizedDeductions =
      toNumber(formData.late) +
      toNumber(formData.id_deduction) +
      toNumber(formData.uniform) +
      toNumber(formData.insurance) +
      toNumber(formData.surety_bond) +
      toNumber(formData.convenience_fee) +
      toNumber(formData.general_deduction);

    const customDeductionsSum = localPayslip?.deduction_details
      ? Object.values(localPayslip.deduction_details).reduce((sum, v) => sum + toNumber(v), 0)
      : 0;

    const totalDeductions = otherItemizedDeductions + customDeductionsSum;

    setLocalPayslip((p) => ({
      ...(p as any),
      standard_pay: formData.standard_pay,
      basic_salary: formData.basic_salary,
      overtime_pay: otCalculated,
      night_differential: formData.night_differential,
      ndot: formData.ndot,
      rest_day: formData.rest_day,
      rest_day_ot: formData.rest_day_ot,
      rest_day_nd: formData.rest_day_nd,
      rest_day_ndot: formData.rest_day_ndot,
      special_holiday: formData.special_holiday,
      special_holiday_ot: formData.special_holiday_ot,
      special_holiday_nd: formData.special_holiday_nd,
      special_holiday_ndot: formData.special_holiday_ndot,
      legal_holiday: formData.legal_holiday,
      legal_holiday_ot: formData.legal_holiday_ot,
      legal_holiday_nd: formData.legal_holiday_nd,
      legal_holiday_ndot: formData.legal_holiday_ndot,
      legal_holiday_rd: formData.legal_holiday_rd,
      legal_holiday_rdot: formData.legal_holiday_rdot,
      legal_holiday_rdnd: formData.legal_holiday_rdnd,
      legal_holiday_rdndot: formData.legal_holiday_rdndot,
      incentives: formData.incentives,
      adjustment: formData.adjustment,
      gas: formData.gas,
      load: formData.load,
      other_allowance: formData.other_allowance,
      rewards_adjustments: formData.rewards_adjustments,
      kpi: formData.kpi,
      allowances: formData.allowances,

      late: formData.late,
      id_deduction: formData.id_deduction,
      uniform: formData.uniform,
      insurance: formData.insurance,
      surety_bond: formData.surety_bond,
      convenience_fee: formData.convenience_fee,
      general_deduction: formData.general_deduction,

      sss_percent: govPercents.sss,
      philhealth_percent: govPercents.philhealth,
      pagibig_percent: govPercents.pagibig,
      sss_deduction: sssDed,
      philhealth_deduction: philDed,
      pagibig_deduction: pagibigDed,
      total_government_deductions: govTotal,
      total_deductions: totalDeductions,
      total_earnings: totalEarnings,
      net_pay: totalEarnings - (totalDeductions + govTotal),
    } as Payslip));
  }, [
    formData.standard_pay,
    formData.basic_salary,
    formData.night_differential,
    formData.ndot,
    formData.rest_day,
    formData.rest_day_ot,
    formData.rest_day_nd,
    formData.rest_day_ndot,
    formData.special_holiday,
    formData.special_holiday_ot,
    formData.special_holiday_nd,
    formData.special_holiday_ndot,
    formData.legal_holiday,
    formData.legal_holiday_ot,
    formData.legal_holiday_nd,
    formData.legal_holiday_ndot,
    formData.legal_holiday_rd,
    formData.legal_holiday_rdot,
    formData.legal_holiday_rdnd,
    formData.legal_holiday_rdndot,
    formData.incentives,
    formData.adjustment,
    formData.gas,
    formData.load,
    formData.other_allowance,
    formData.rewards_adjustments,
    formData.kpi,
    formData.allowances,

    formData.late,
    formData.id_deduction,
    formData.uniform,
    formData.insurance,
    formData.surety_bond,
    formData.convenience_fee,
    formData.general_deduction,

    govPercents,
    localPayslip?.deduction_details
  ]);

  const renderField = (
    label: string,
    key: keyof typeof formData,
    isReadOnly: boolean = false,
    computedVal?: number
  ) => {
    const val = computedVal !== undefined ? computedVal : toNumber(formData[key]);
    return (
      <div className="flex flex-col gap-1 border-b border-gray-100 dark:border-slate-800/40 pb-2">
        <label className="text-gray-400 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider">{label}</label>
        {isEditMode && !isReadOnly ? (
          <input
            title={label}
            placeholder={`0.00`}
            type="number"
            value={formData[key] as number || ''}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: toNumber(e.target.value) }))}
            className="input-field w-full px-3 py-1 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner"
          />
        ) : (
          <p className="text-gray-800 dark:text-gray-200 font-bold text-xs mt-0.5 flex items-center justify-between">
            <span className="font-mono text-gray-900 dark:text-gray-100">
              ₱{val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {isReadOnly && (
              <span className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded tracking-widest border border-red-100/50 dark:border-red-900/20">
                25% Fixed
              </span>
            )}
          </p>
        )}
      </div>
    );
  };

  const basicFields = [
    { label: 'Standard Pay', key: 'standard_pay' },
    { label: 'Basic Salary/Pay', key: 'basic_salary' },
    { label: 'Overtime Pay', key: 'overtime_pay', isReadOnly: true, computed: toNumber(formData.basic_salary) * 0.25 },
  ];

  const differentialFields = [
    { label: 'Night Differential', key: 'night_differential' },
    { label: 'NDOT', key: 'ndot' },
    { label: 'Rest Day Pay', key: 'rest_day' },
    { label: 'Rest Day OT', key: 'rest_day_ot' },
    { label: 'Rest Day ND', key: 'rest_day_nd' },
    { label: 'Rest Day NDOT', key: 'rest_day_ndot' },
  ];

  const holidayFields = [
    { label: 'Special Holiday Pay', key: 'special_holiday' },
    { label: 'Special Holiday OT', key: 'special_holiday_ot' },
    { label: 'Special Holiday ND', key: 'special_holiday_nd' },
    { label: 'Special Holiday NDOT', key: 'special_holiday_ndot' },
    { label: 'Legal Holiday Pay', key: 'legal_holiday' },
    { label: 'Legal Holiday OT', key: 'legal_holiday_ot' },
    { label: 'Legal Holiday ND', key: 'legal_holiday_nd' },
    { label: 'Legal Holiday NDOT', key: 'legal_holiday_ndot' },
    { label: 'Legal Holiday RD', key: 'legal_holiday_rd' },
    { label: 'Legal Holiday RDOT', key: 'legal_holiday_rdot' },
    { label: 'Legal Holiday RDND', key: 'legal_holiday_rdnd' },
    { label: 'Legal Holiday RDNDOT', key: 'legal_holiday_rdndot' },
  ];

  const allowanceFields = [
    { label: 'Incentives', key: 'incentives' },
    { label: 'Adjustment', key: 'adjustment' },
    { label: 'Gas Allowance', key: 'gas' },
    { label: 'Load Allowance', key: 'load' },
    { label: 'Other Allowance', key: 'other_allowance' },
    { label: 'Rewards/Adjustments', key: 'rewards_adjustments' },
    { label: 'KPI', key: 'kpi' },
    { label: 'Legacy Allowances', key: 'allowances' },
  ];

  const deductionsFields = [
    { label: 'Late Deduction', key: 'late' },
    { label: 'ID Card Fee', key: 'id_deduction' },
    { label: 'Uniform Fee', key: 'uniform' },
    { label: 'Insurance Premium', key: 'insurance' },
    { label: 'Surety Bond', key: 'surety_bond' },
    { label: 'Convenience Fee', key: 'convenience_fee' },
    { label: 'General Deduction', key: 'general_deduction' },
  ];

  const renderSection = (title: string, fields: typeof basicFields, icon: React.ReactNode) => {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
        <h4 className="text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
          {icon}
          <span>{title}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
          {fields.map((field) => (
            <div key={field.key} className="sm:col-span-1">
              {renderField(field.label, field.key as any, field.isReadOnly, field.computed)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!payslip && !localPayslip) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="3xl">
      <div className="space-y-6">
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-red-800 via-red-950 to-slate-950 p-6 text-white relative shadow-xl rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <div />
            <button
              onClick={handleDownload}
              className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all text-white border border-white/10"
              aria-label="Download CSV"
            >
              <Download size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="shrink-0 relative">
              {localPayslip?.profile_image_url || localPayslip?.profile_image ? (
                <img
                  src={localPayslip?.profile_image_url || localPayslip?.profile_image}
                  alt={localPayslip?.full_name || localPayslip?.fullname || 'Employee'}
                  className="w-20 h-20 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-2 border-white/30 bg-red-800/80 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {(localPayslip?.full_name || localPayslip?.fullname || 'E').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight truncate flex items-center gap-2">
                <span>{localPayslip?.full_name || localPayslip?.fullname || 'N/A'}</span>
              </h2>
              <p className="text-red-200 text-xs font-semibold tracking-wider uppercase mt-1 flex items-center gap-1.5">
                <span className="bg-red-900/60 text-red-200 px-2 py-0.5 rounded font-black text-[9px]">JTP</span>
                <span>{localPayslip?.jtp_code || 'N/A'}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 mt-4 text-xs text-white/80 border-t border-white/10 pt-3.5">
                <div>
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">Position</span>
                  <span className="font-semibold text-white truncate block flex items-center gap-1 mt-0.5">
                    <Briefcase size={12} className="text-red-200/60" />
                    {localPayslip?.position || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">Date Hired</span>
                  <span className="font-semibold text-white block mt-0.5">
                    {localPayslip?.date_hired ? new Date(localPayslip.date_hired).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">Hub Name</span>
                  <span className="font-semibold text-white truncate block mt-0.5">
                    {localPayslip?.hub_name || localPayslip?.hub || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <span className="text-red-100 font-medium">Payroll Period:</span>
            {isEditMode ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-red-200 text-[10px] uppercase font-bold">Start:</span>
                  <input
                    title="Period Start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => handlePeriodStartChange(e.target.value)}
                    className="bg-slate-900 text-white border border-white/20 rounded-xl px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-red-200 text-[10px] uppercase font-bold">End:</span>
                  <input
                    title="Period End"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => handlePeriodEndChange(e.target.value)}
                    className="bg-slate-900 text-white border border-white/20 rounded-xl px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>
            ) : (
              <span className="font-bold text-white text-right">
                {formatPayslipPeriod(localPayslip?.period_start || periodStart, localPayslip?.period_end || periodEnd)}
              </span>
            )}
          </div>
        </div>

        {/* GOVERNMENT IDS SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm">
          <h4 className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-4">Employee Government IDs</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">TIN:</p>
              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 font-mono">{localPayslip?.tin || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">SSS No:</p>
              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 font-mono">{localPayslip?.sss_no || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">PhilHealth No:</p>
              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 font-mono">{localPayslip?.philhealth_no || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Pag-IBIG No:</p>
              <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 font-mono">{localPayslip?.pagibig_no || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* TWO COLUMN CONTENT PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: EARNINGS BREAKDOWN (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-6">
              
              {renderSection('Basic Pay & Salary', basicFields, <DollarSign size={15} className="text-green-500" />)}
              
              {renderSection('Differentials & Rest Days', differentialFields, <Clock size={15} className="text-blue-500" />)}
              
              {renderSection('Special & Legal Holidays', holidayFields, <Calendar size={15} className="text-red-500" />)}
              
              {renderSection('Allowances & Performance Bonuses', allowanceFields, <Award size={15} className="text-purple-500" />)}

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                <span className="text-green-700 dark:text-green-400 font-black text-xs uppercase tracking-wider">Total Earnings</span>
                <span className="text-green-700 dark:text-green-400 font-extrabold text-sm font-mono">
                  ₱{toNumber(localPayslip?.total_earnings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DEDUCTIONS & ATTENDANCE (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ATTENDANCE SUMMARY */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <h3 className="text-gray-800 dark:text-gray-100 font-bold text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-800/80 pb-3.5 mb-4">Attendance Summary</h3>
              <div className="grid grid-cols-2 gap-5 text-xs">
                <div className="bg-gray-50/50 dark:bg-slate-950/40 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                  <p className="text-gray-400 font-medium">Total Hours</p>
                  <p className="text-gray-850 dark:text-gray-250 font-bold text-sm mt-0.5">
                    {localPayslip?.total_hours ?? localPayslip?.totalHours ?? '0'} hrs
                  </p>
                </div>
                <div className="bg-gray-50/50 dark:bg-slate-950/40 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                  <p className="text-gray-400 font-medium">Overtime Hours</p>
                  <p className="text-gray-850 dark:text-gray-250 font-semibold text-sm mt-0.5">
                    {localPayslip?.overtime_hours ?? '0'} hrs
                  </p>
                </div>
                <div className="bg-gray-50/50 dark:bg-slate-950/40 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                  <p className="text-gray-400 font-medium">Lates</p>
                  <p className="text-gray-850 dark:text-gray-250 font-semibold text-sm mt-0.5">
                    {localPayslip?.lates ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50/50 dark:bg-slate-950/40 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                  <p className="text-gray-400 font-medium">Absences</p>
                  <p className="text-gray-850 dark:text-gray-250 font-semibold text-sm mt-0.5">
                    {localPayslip?.absences ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* DEDUCTIONS BREAKDOWN */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
              <h3 className="text-gray-800 dark:text-gray-100 font-bold text-sm border-b border-gray-100 dark:border-slate-800/80 pb-3 mb-4 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider">Deductions</span>
                <span className="text-xs text-red-600 font-bold uppercase tracking-wider">In PHP</span>
              </h3>

              {/* Government Mandated */}
              <div className="bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl space-y-3.5 shadow-sm">
                <p className="text-gray-700 dark:text-gray-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800/80 pb-2">
                  <ShieldAlert size={13} className="text-amber-500" />
                  <span>Government Mandated</span>
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">SSS</span>
                    {isEditMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={govPercents.sss}
                          onChange={(e) => setGovPercents((p) => ({ ...p, sss: toNumber(e.target.value) }))}
                          className="input-field w-16 text-right py-0.5 px-2 border border-gray-205 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
                        />
                        <span className="text-gray-400 text-[10px] font-mono">% (₱{toNumber(localPayslip?.sss_deduction).toFixed(2)})</span>
                      </div>
                    ) : (
                      <span className="text-gray-850 dark:text-gray-200 font-bold font-mono">
                        ₱{toNumber(localPayslip?.sss_deduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({localPayslip?.sss_percent || '0'}%)
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">PhilHealth</span>
                    {isEditMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={govPercents.philhealth}
                          onChange={(e) => setGovPercents((p) => ({ ...p, philhealth: toNumber(e.target.value) }))}
                          className="input-field w-16 text-right py-0.5 px-2 border border-gray-205 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
                        />
                        <span className="text-gray-400 text-[10px] font-mono">% (₱{toNumber(localPayslip?.philhealth_deduction).toFixed(2)})</span>
                      </div>
                    ) : (
                      <span className="text-gray-850 dark:text-gray-200 font-bold font-mono">
                        ₱{toNumber(localPayslip?.philhealth_deduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({localPayslip?.philhealth_percent || '0'}%)
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Pag-IBIG</span>
                    {isEditMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={govPercents.pagibig}
                          onChange={(e) => setGovPercents((p) => ({ ...p, pagibig: toNumber(e.target.value) }))}
                          className="input-field w-16 text-right py-0.5 px-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
                        />
                        <span className="text-gray-400 text-[10px] font-mono">% (₱{toNumber(localPayslip?.pagibig_deduction).toFixed(2)})</span>
                      </div>
                    ) : (
                      <span className="text-gray-850 dark:text-gray-200 font-bold font-mono">
                        ₱{toNumber(localPayslip?.pagibig_deduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({localPayslip?.pagibig_percent || '0'}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Itemized Deductions */}
              <div className="bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl space-y-3.5 shadow-sm">
                <p className="text-gray-700 dark:text-gray-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800/80 pb-2">
                  <Percent size={13} className="text-red-500" />
                  <span>Itemized Deductions</span>
                </p>
                <div className="space-y-3">
                  {deductionsFields.map((field) => (
                    <div key={field.key}>
                      {renderField(field.label, field.key as any)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Custom Deductions */}
              {localPayslip?.deduction_details && Object.keys(localPayslip.deduction_details).length > 0 && (
                <div className="bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl space-y-2.5 shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300 font-bold text-[10px] uppercase tracking-wider border-b border-gray-100 dark:border-slate-800/80 pb-2">
                    Other Deductions
                  </p>
                  <div className="space-y-2">
                    {Object.entries(localPayslip.deduction_details).map(([label, amount]) => (
                      <div key={label} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
                        <span className="text-gray-850 dark:text-gray-250 font-bold font-mono">
                          ₱{toNumber(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Deductions Panel */}
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                <span className="text-red-700 dark:text-red-400 font-black text-xs uppercase tracking-wider">Total Deductions</span>
                <span className="text-red-700 dark:text-red-400 font-extrabold text-sm font-mono">
                  ₱{(toNumber(localPayslip?.total_deductions) + toNumber(localPayslip?.total_government_deductions)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM CARD: SALARY / NET PAY SUMMARY */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Net Salary Payday</p>
            <h3 className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
              ₱{toNumber(localPayslip?.net_pay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="flex gap-4 items-center">
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-black block text-right">Status</span>
              {isEditMode ? (
                <select
                  title="Status"
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="input-field py-1 px-3 text-xs bg-white text-gray-800 rounded-xl mt-1 border-0 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-semibold"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  {isAdmin && <option value="approved">Approved</option>}
                </select>
              ) : (
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mt-1 uppercase tracking-wider border shadow-sm ${localPayslip?.status === 'approved'
                    ? 'bg-green-500 border-green-400 text-white'
                    : localPayslip?.status === 'pending'
                    ? 'bg-amber-500 border-amber-400 text-white'
                    : 'bg-yellow-500 border-yellow-400 text-white'
                  }`}>
                  {localPayslip?.status || 'Draft'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t border-gray-200 dark:border-slate-800/80 pt-4 flex flex-col sm:flex-row gap-3 justify-end">
          {isEditMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditMode(false);
                }}
                className="bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-6 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm"
              >
                Edit Payroll
              </button>
              <button
                onClick={onClose}
                className="bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-6 rounded-xl transition-all text-sm"
              >
                Close
              </button>
            </>
          )}
        </div>

        {/* HISTORY SECTION */}
        {history.length > 0 && (
          <div className="pt-6 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/10 rounded-b-2xl">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Past Payroll History</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map((prev) => (
                <div key={prev.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-850 hover:border-red-400 dark:hover:border-red-900 transition-all shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {formatPayslipPeriod(prev.period_start, prev.period_end)}
                    </p>
                    <p className="text-[10px] text-green-600 font-bold mt-1">
                      Net Pay: ₱{toNumber(prev.net_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={() => setLocalPayslip(prev)}
                    className="text-[10px] font-black uppercase tracking-widest text-red-650 hover:text-red-700 flex items-center gap-0.5"
                  >
                    <span>View Record</span>
                    <ChevronRight size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
