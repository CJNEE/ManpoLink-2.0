import { Modal } from './Modal';
import { useEffect, useState } from 'react';
import { useGetAttendance } from '@/hooks/useQueries';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number | null;
}

export const AttendanceHistoryModal = ({ isOpen, onClose, employeeId }: Props) => {
  const [params, setParams] = useState<Record<string, any> | undefined>(undefined);
  const attendanceQuery = useGetAttendance(params);
  const [preview, setPreview] = useState<{ in?: string | null; out?: string | null } | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      setParams({ employee_id: employeeId });
    }
  }, [isOpen, employeeId]);

  const attendance = normalizeApiResponse(attendanceQuery.data);

  return (
    <Modal isOpen={isOpen} onClose={() => { setPreview(null); onClose(); }} title="Attendance History">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {attendance.length === 0 && <p>No attendance records found.</p>}
        {attendance.map((rec: Record<string, unknown> & { id?: number | string; date?: string; employee?: string; clock_in_time?: string; clock_out_time?: string; clock_in_image?: string; clock_out_image?: string; }) => (
          <div key={rec.id || `${rec.date}-${rec.employee}`} className="border rounded p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{rec.date}</p>
                <p className="font-semibold">In: {rec.clock_in_time || '-'}</p>
                <p className="font-semibold">Out: {rec.clock_out_time || '-'}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setPreview({ in: rec.clock_in_image || null, out: rec.clock_out_image || null })}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}

        {preview && (
          <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[10000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-[90vw] max-w-3xl">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">Clock In</p>
                {preview.in ? (
                  <img src={preview.in} alt="clock-in" className="w-full h-56 object-cover rounded" />
                ) : (
                  <div className="w-full h-56 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">Clock Out</p>
                {preview.out ? (
                  <img src={preview.out} alt="clock-out" className="w-full h-56 object-cover rounded" />
                ) : (
                  <div className="w-full h-56 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>

              <div className="absolute top-2 right-2">
                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setPreview(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
