import { useState } from 'react';
import { Button } from '@/components/common';
import { Modal } from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { Send } from 'lucide-react';
import { apiUrl } from '@/constants/api';

interface EditInfoRequestModalProps {
  employeeId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditInfoRequestModal = ({ employeeId, isOpen, onClose, onSuccess }: EditInfoRequestModalProps) => {
  const { success, error } = useToast();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const requestableFields = [
    'firstname', 'lastname', 'middle_initial', 'place_of_birth', 'date_of_birth',
    'gender', 'nationality', 'marital_status', 'email_address', 'phone_number',
    'current_address', 'permanent_address', 'emergency_contact_name',
    'emergency_contact_phone', 'tin', 'sss', 'philhealth', 'pagibig'
  ];

  const handleFieldSelect = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleFieldValueChange = (field: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (selectedFields.length === 0) {
      error('Please select at least one field to edit');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      // Create requested_data object with selected field values
      const requestedData: Record<string, any> = {};
      selectedFields.forEach(field => {
        requestedData[field] = fieldValues[field] || '';
      });

      formData.append('employee', String(employeeId));
      formData.append('requested_data', JSON.stringify(requestedData));

      if (attachedFile) {
        formData.append('uploaded_files', attachedFile);
      }

      const response = await fetch(apiUrl('edit-requests/'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit edit request');
      }

      success('Edit request submitted successfully!');
      setSelectedFields([]);
      setFieldValues({});
      setAttachedFile(null);
      onClose();
      onSuccess?.();
    } catch (err) {
      error('Failed to submit edit request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Info Changes">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Select the fields you want to change and provide new values
          </p>

          <div className="space-y-2">
            {requestableFields.map(field => (
              <div key={field} className="border rounded p-2 dark:border-gray-700">
                <label className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={() => handleFieldSelect(field)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium capitalize">
                    {field.replace(/_/g, ' ')}
                  </span>
                </label>

                {selectedFields.includes(field) && (
                  <input
                    type="text"
                    placeholder="Enter new value"
                    value={fieldValues[field] || ''}
                    onChange={e => handleFieldValueChange(field, e.target.value)}
                    className="w-full text-sm px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Attach Supporting Documents (optional)
          </label>
          <input
            type="file"
            onChange={e => setAttachedFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          {attachedFile && (
            <p className="text-sm text-gray-500 mt-1">
              Selected: {attachedFile.name}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || selectedFields.length === 0}
            icon={<Send size={18} />}
            className="flex-1"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
