import { useEffect } from 'react';

type Props = {
  open: boolean;
  clockInImage: string | null;
  clockOutImage: string | null;
  onClose: () => void;
};

export const AttendancePhotoViewer = ({
  open,
  clockInImage,
  clockOutImage,
  onClose,
}: Props) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="font-semibold">Attendance Photos</div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Clock In
            </div>
            {clockInImage ? (
              <img
                src={clockInImage}
                alt="Clock in"
                className="w-full h-[420px] object-contain bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-full h-[420px] flex items-center justify-center text-gray-500 dark:text-gray-400 border border-dashed rounded">
                No clock-in image
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Clock Out
            </div>
            {clockOutImage ? (
              <img
                src={clockOutImage}
                alt="Clock out"
                className="w-full h-[420px] object-contain bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-full h-[420px] flex items-center justify-center text-gray-500 dark:text-gray-400 border border-dashed rounded">
                No clock-out image
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

