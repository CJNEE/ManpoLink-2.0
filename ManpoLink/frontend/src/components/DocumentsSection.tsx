import { useState, useRef } from 'react';
import { Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmployeeDocument } from '@/types';
import { useUploadDocument, useDeleteDocument } from '@/hooks/useQueries';

interface DocumentsSectionProps {
  documents: EmployeeDocument[];
  employeeId: number;
  onUpdate?: () => void;
  readOnly?: boolean;
}

export const DocumentsSection = ({ documents, employeeId, onUpdate, readOnly = false }: DocumentsSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setUploading(true);
    try {
      await uploadMutation.mutateAsync({
        employeeId,
        file,
        fileName: file.name,
      });
      toast.success('Document uploaded successfully');
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteMutation.mutateAsync(docId);
      toast.success('Document deleted successfully');
      onUpdate?.();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.success('Document removed');
        onUpdate?.();
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const displaySize = (doc: EmployeeDocument) =>
    formatFileSize((doc.file_size ?? 0) * 1024);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#8B0000]">
            <FileText size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
        </div>
        {!readOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        )}
      </div>
      
      {!readOnly && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#8B0000] hover:bg-red-50/30 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-[#8B0000]" />
          ) : (
            <Upload size={24} className="text-gray-400" />
          )}
          <span className="text-sm text-gray-500">
            {uploading ? 'Uploading...' : 'Click to upload document'}
          </span>
          <span className="text-xs text-gray-400">PDF, DOC, JPG, PNG (max 5MB)</span>
        </button>
      )}
      
      <div className="mt-4 space-y-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-[#8B0000]" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">{doc.file_name}</p>
                  <p className="text-xs text-gray-500">{displaySize(doc)} | {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <Download size={18} className="text-gray-600" />
                </a>
                {!readOnly && (
                  <button onClick={() => handleDelete(doc.id)} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">No documents uploaded</p>
        )}
      </div>
    </div>
  );
};

export default DocumentsSection;