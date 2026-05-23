import { useState, useEffect } from 'react';
import { Card, Button, ErrorMessage } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { apiUrl } from '@/constants/api';

type LeaveRequestPayload = {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
};

type Props = {
  showHeader?: boolean;
};

export const EmployeeLeaveRequestForm = ({ showHeader = true }: Props) => {
  const { success, error } = useToast();

  const [step, setStep] = useState(1);

  const [payload, setPayload] = useState<LeaveRequestPayload>({
    leave_type: 'Sick Leave',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const token = localStorage.getItem('access_token');
  const { employee } = useAuth();

  const steps = [
    { id: 1, label: 'Leave Details' },
    { id: 2, label: 'Reason & Proof' },
    { id: 3, label: 'Review' },
  ];

  const progress = (step / steps.length) * 100;

  const onChange = (key: keyof LeaveRequestPayload, value: string) => {
    setPayload((p) => ({ ...p, [key]: value }));
    setFormError(null);
  };

  const validate = () => {
    if (step === 1) {
      if (!payload.start_date) return 'Select start date';
      if (!payload.end_date) return 'Select end date';
      if (new Date(payload.end_date) < new Date(payload.start_date))
        return 'End date cannot be earlier than start date';
    }

    if (step === 2) {
      if (!payload.reason.trim()) return 'Please provide a reason';
    }

    return null;
  };

  const next = () => {
    const v = validate();
    if (v) return setFormError(v);
    setStep((s) => s + 1);
  };

  const back = () => {
    setStep((s) => Math.max(1, s - 1));
    setFormError(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles((p) => [...p, ...Array.from(e.target.files!)]);
  };

  const removeFile = (i: number) => {
    setFiles((p) => p.filter((_, idx) => idx !== i));
  };

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          URL.revokeObjectURL(file as any);
        }
      });
    };
  }, [files]);

  const submit = async () => {
    try {
      setLoading(true);

      if (!token) {
        error('You are not authenticated. Please login.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
        return;
      }

      const formData = new FormData();
      // include employee id (backend usually expects employee reference)
      if (employee?.id) formData.append('employee', String(employee.id));
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));

      files.forEach((f) => formData.append('attachments', f));

      const res = await fetch(apiUrl('leave-requests/'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // parse response body for better error messages
      const body = await res.text();
      let json: any = null;
      try {
        json = body ? JSON.parse(body) : null;
      } catch (e) {
        // not json
      }

      if (!res.ok) {
        // try to extract meaningful message from json
        let msg = 'Failed to submit leave request';
        if (json) {
          if (json.detail) msg = json.detail;
          else if (json.message) msg = json.message;
          else {
            // join validation errors
            const parts: string[] = [];
            Object.entries(json).forEach(([k, v]) => {
              if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
              else parts.push(`${k}: ${String(v)}`);
            });
            if (parts.length) msg = parts.join(' | ');
          }
        } else {
          msg = body || msg;
        }

        console.error('Leave request error', { status: res.status, body: json ?? body });
        if (res.status === 401) {
          // Token expired or invalid — clear and redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('currentEmployee');
          window.location.href = '/login';
        }
        throw new Error(msg);
      }

      success('Leave request submitted successfully');

      setStep(1);
      setPayload({
        leave_type: 'Sick Leave',
        start_date: '',
        end_date: '',
        reason: '',
      });
      setFiles([]);
    } catch (e: any) {
      error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-2 sm:p-4">

      <div className="w-full max-w-3xl mx-auto">

        <Card className="p-6 sm:p-8 rounded-xl shadow-md bg-white dark:bg-[#0b1220]">

          {/* HEADER */}
          {showHeader && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Leave Request
              </h2>
              <p className="text-sm text-gray-500">
                Submit your leave request in 3 simple steps
              </p>
            </div>
          )}

          {/* PROGRESS BAR */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full mb-6">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* STEPS */}
          <div className="flex justify-between mb-6 text-xs sm:text-sm gap-2">
            {steps.map((s) => {
              const isActive = step === s.id;
              const isDone = step > s.id;

              return (
                <div
                  key={s.id}
                  className="flex flex-col items-center flex-1 min-w-0"
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border flex-shrink-0
                      ${isActive ? 'bg-blue-600 text-white border-blue-600' : ''}
                      ${isDone ? 'bg-green-500 text-white border-green-500' : ''}
                      ${!isActive && !isDone ? 'text-gray-400 border-gray-300 dark:text-gray-400 dark:border-gray-600' : ''}
                    `}
                  >
                    {isDone ? '✓' : s.id}
                  </div>

                  <span
                    className={`mt-1 truncate text-center ${isActive ? 'text-blue-500 font-medium' : 'text-gray-400 dark:text-gray-400'}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {formError && <ErrorMessage message={formError} />}

          {/* CONTENT */}
          <div className="min-h-[200px]">

            {step === 1 && (
              <div className="space-y-4">
                <select
                  value={payload.leave_type}
                  onChange={(e) =>
                    onChange('leave_type', e.target.value)
                  }
                  className="input-field w-full rounded-xl"
                >
                  <option>Sick Leave</option>
                  <option>Vacation Leave</option>
                  <option>Emergency Leave</option>
                  <option>Others</option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={payload.start_date}
                    onChange={(e) =>
                      onChange('start_date', e.target.value)
                    }
                    className="input-field w-full rounded-xl"
                  />

                  <input
                    type="date"
                    value={payload.end_date}
                    onChange={(e) =>
                      onChange('end_date', e.target.value)
                    }
                    className="input-field w-full rounded-xl"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <textarea
                  value={payload.reason}
                  onChange={(e) =>
                    onChange('reason', e.target.value)
                  }
                  className="input-field w-full min-h-[120px] rounded-xl"
                  placeholder="Explain your reason..."
                />

                <input type="file" multiple onChange={handleFile} className="text-sm" />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    const isPDF = file.type === 'application/pdf';
                    const previewUrl = isImage
                      ? URL.createObjectURL(file)
                      : null;

                    return (
                      <div
                        key={index}
                        className="relative border rounded-lg p-2 bg-gray-100 dark:bg-gray-800 overflow-hidden"
                      >
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 text-xs bg-red-500 text-white px-2 rounded"
                        >
                          ✕
                        </button>

                        {isImage && previewUrl && (
                          <img
                            src={previewUrl}
                            className="w-full h-20 object-cover rounded"
                          />
                        )}

                        {isPDF && (
                          <div className="h-20 flex items-center justify-center text-2xl">
                            📄
                          </div>
                        )}

                        {!isImage && !isPDF && (
                          <div className="h-20 flex items-center justify-center text-2xl">
                            📎
                          </div>
                        )}

                        <p className="text-xs mt-1 truncate text-center">
                          {file.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <p><b>Type:</b> {payload.leave_type}</p>
                <p><b>Start:</b> {payload.start_date}</p>
                <p><b>End:</b> {payload.end_date}</p>
                <p><b>Reason:</b> {payload.reason}</p>
                <p><b>Files:</b> {files.length}</p>
              </div>
            )}

          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
            <div className="w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={back}
                disabled={step === 1}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
            </div>

            <div className="w-full sm:w-auto">
              {step < 3 ? (
                <Button onClick={next} className="w-full">
                  Next
                </Button>
              ) : (
                <Button onClick={submit} isLoading={loading} className="w-full">
                  Submit
                </Button>
              )}
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
};