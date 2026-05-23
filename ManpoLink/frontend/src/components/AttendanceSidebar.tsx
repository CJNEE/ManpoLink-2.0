import { useState, useEffect, useRef } from 'react';
import { Clock, Loader2, History, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetAttendance, useClockIn, useClockOut } from '@/hooks/useQueries';

interface AttendanceSidebarProps {
  employeeId: number;
  onViewHistory?: () => void;
}

const formatAttendanceTime = (timeStr: string | undefined | null) => {
  if (!timeStr) return '--:--';
  try {
    if (timeStr.includes(':') && !timeStr.includes('-') && !timeStr.includes('T')) {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const hour = parseInt(parts[0], 10);
        const minutes = parts[1].padStart(2, '0');
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayHourStr = displayHour.toString().padStart(2, '0');
        return `${displayHourStr}:${minutes} ${ampm}`;
      }
    }
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '--:--';
  }
};

export const AttendanceSidebar = ({ employeeId, onViewHistory }: AttendanceSidebarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const attendanceQuery = useGetAttendance({ employee_id: employeeId, date: today });
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();
  
  const todayAttendance = attendanceQuery.data?.results?.[0] || attendanceQuery.data?.[0] || null;
  const hasClockedIn = !!todayAttendance?.clock_in_time;
  const hasClockedOut = !!todayAttendance?.clock_out_time;
  const canClockIn = !hasClockedIn;
  const canClockOut = hasClockedIn && !hasClockedOut;
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const handleClockIn = async () => {
    if (!canClockIn) { toast.error('Already clocked in today'); return; }
    const formData = new FormData();
    formData.append('employee', employeeId.toString());
    formData.append('date', today);
    if (file) formData.append('clock_in_image', file);
    try {
      await clockInMutation.mutateAsync(formData);
      toast.success('Clocked in successfully');
      attendanceQuery.refetch();
    } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to clock in'); }
  };
  
  const handleClockOut = async () => {
    if (!canClockOut) { toast.error('Already clocked out today'); return; }
    const formData = new FormData();
    formData.append('employee', employeeId.toString());
    formData.append('date', today);
    if (file) formData.append('clock_out_image', file);
    try {
      await clockOutMutation.mutateAsync(formData);
      toast.success('Clocked out successfully');
      attendanceQuery.refetch();
    } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to clock out'); }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };
  
  const getStatusText = () => {
    if (!hasClockedIn) return 'Not Yet Clocked In';
    if (!hasClockedOut) return 'Working';
    return 'Completed';
  };
  
  const getStatusBadgeClass = () => {
    if (hasClockedOut) return 'bg-green-100 text-green-700';
    if (hasClockedIn) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#8B0000]"><Clock size={20} /></div>
        <div><h3 className="text-lg font-semibold text-gray-800">Attendance</h3><p className="text-sm text-gray-500">{formatDate(currentTime)}</p></div>
      </div>
      
      <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-4xl font-bold text-[#8B0000] font-mono">{formatTime(currentTime)}</div>
      </div>
      
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Clock In</p>
            <p className="text-lg font-semibold text-gray-800">{formatAttendanceTime(todayAttendance?.clock_in_time)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Clock Out</p>
            <p className="text-lg font-semibold text-gray-800">{formatAttendanceTime(todayAttendance?.clock_out_time)}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeClass()}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="mb-6">
        <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" id="attendance-photo" ref={fileInputRef} />
        <label htmlFor="attendance-photo" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#8B0000] transition-colors">
          <Camera size={20} className="text-gray-400" />
          <span className="text-sm text-gray-500">{file ? file.name : 'Take Photo'}</span>
        </label>
      </div>
      
      <div className="space-y-3">
        <button onClick={handleClockIn} disabled={!canClockIn || clockInMutation.isPending} className={`w-full py-3 rounded-lg font-medium text-white transition-all ${canClockIn ? 'bg-[#8B0000] hover:bg-[#6B0000] shadow-md' : 'bg-gray-300 cursor-not-allowed'}`}>
          {clockInMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" />Processing...</span> : hasClockedIn ? 'Already Clocked In' : 'Clock In'}
        </button>
        <button onClick={handleClockOut} disabled={!canClockOut || clockOutMutation.isPending} className={`w-full py-3 rounded-lg font-medium text-white transition-all ${canClockOut ? 'bg-[#4F7BFF] hover:bg-[#3D6BEF] shadow-md' : 'bg-gray-300 cursor-not-allowed'}`}>
          {clockOutMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" />Processing...</span> : hasClockedOut ? 'Already Clocked Out' : 'Clock Out'}
        </button>
      </div>
      
      <button onClick={onViewHistory} className="mt-4 w-full py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
        <History size={18} />View Attendance History
      </button>
    </div>
  );
};

export default AttendanceSidebar;
