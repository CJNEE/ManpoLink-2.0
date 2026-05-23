import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/api/apiService';
import { Card, Badge, LoadingSpinner } from './common';
import { Calendar, Clock, User, MessageSquare, Paperclip, Eye, Download, ChevronRight } from 'lucide-react';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeLeaveHistoryModal = ({ isOpen, onClose }: Props) => {
  const { employee } = useAuth();
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'pdf' | 'other' } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!employee?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    const fetcher = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/leave-requests/', {
          params: { employee_id: employee.id },
        });
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.results ?? [];
        setItems(list);
        if (list.length > 0 && !selected) {
          setSelected(list[0]);
        }
      } catch (e) {
        console.error(e);
        error('Failed to load leave history');
      } finally {
        setLoading(false);
      }
    };

    void fetcher();
  }, [isOpen, employee?.id]);

  const handlePreview = (url: string) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    const isPdf = /\.pdf$/i.test(url);
    setPreviewFile({
      url,
      type: isImage ? 'image' : isPdf ? 'pdf' : 'other'
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Leave History" size="xl">
      <div className="flex flex-col md:flex-row h-[75vh] bg-white dark:bg-dark-bg overflow-hidden rounded-b-xl">
        {/* Sidebar - List of Requests */}
        <div className="w-full md:w-80 border-r dark:border-gray-800 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/30">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-12">
              <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-medium">No leave requests found</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {items.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full p-4 text-left transition-all hover:bg-white dark:hover:bg-gray-800 flex items-center justify-between group ${
                    selected?.id === r.id ? 'bg-white dark:bg-gray-800 border-l-4 border-red-600 shadow-sm' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-tight">{r.leave_type}</span>
                      <Badge variant={getStatusVariant(r.status)} size="sm" className="text-[8px] uppercase px-1.5 py-0">{r.status}</Badge>
                    </div>
                    <p className="font-bold text-[13px] text-gray-900 dark:text-gray-100">
                      {new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium italic">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <ChevronRight size={16} className={`text-gray-300 transition-transform ${selected?.id === r.id ? 'translate-x-1 text-red-600' : 'group-hover:translate-x-0.5'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content - Request Details */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-60">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-800">
                <Paperclip size={28} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">Select a request</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Header Section */}
              <div className="flex flex-col gap-6 mb-10 pb-8 border-b dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={getStatusVariant(selected.status)} className="mb-3 font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1">
                      {selected.status}
                    </Badge>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-4">
                      {selected.leave_type}
                    </h2>
                    <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                        <Calendar size={14} className="text-red-600" />
                        <span>{new Date(selected.start_date).toLocaleDateString()} → {new Date(selected.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-red-600" />
                        <span>Requested {new Date(selected.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Information Column */}
                <div className="lg:col-span-3 space-y-8">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                      <MessageSquare size={14} className="text-red-600" />
                      Reason for Leave
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">
                        "{selected.reason || 'No reason provided'}"
                      </p>
                    </div>
                  </div>

                  {selected.status !== 'pending' && (
                    <div className="space-y-3">
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                        selected.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <User size={14} />
                        Admin Review
                      </h4>
                      <div className={`p-6 rounded-3xl border shadow-sm ${
                        selected.status === 'approved' 
                        ? 'bg-green-50/30 dark:bg-green-900/5 border-green-100/50 dark:border-green-900/10' 
                        : 'bg-red-50/30 dark:bg-red-900/5 border-red-100/50 dark:border-red-900/10'
                      }`}>
                        <p className="text-[13px] font-black text-gray-900 dark:text-white mb-2">
                          Reviewed by <span className="text-red-600">{selected.reviewed_by_name || 'Administrator'}</span>
                        </p>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed italic mb-4">
                          {selected.notes || 'No additional comments provided.'}
                        </p>
                        {selected.reviewed_at && (
                          <div className="pt-4 border-t dark:border-gray-800/50 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <Clock size={12} />
                            {new Date(selected.reviewed_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Attachments Column */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2 mb-4">
                    <Paperclip size={14} className="text-red-600" />
                    Attachments <span className="bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full text-[9px]">{selected.attachments?.length || 0}</span>
                  </h4>
                  
                  {(!selected.attachments || selected.attachments.length === 0) ? (
                    <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl p-10 border-2 border-dashed border-gray-100 dark:border-gray-800 text-center flex flex-col items-center justify-center opacity-60">
                      <Paperclip size={24} className="text-gray-300 mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No files</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {selected.attachments.map((url: string, idx: number) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        return (
                          <div 
                            key={idx} 
                            className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden aspect-square border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-500"
                          >
                            {isImage ? (
                              <img src={url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mb-2 shadow-sm">
                                  <Paperclip size={18} className="text-red-600" />
                                </div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter truncate w-full text-center px-2">
                                  {url.split('/').pop()?.split('?')[0] || 'Document'}
                                </span>
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gray-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                              <button 
                                onClick={() => handlePreview(url)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform scale-90 group-hover:scale-100"
                              >
                                <Eye size={14} /> View
                              </button>
                              <a 
                                href={url} 
                                download 
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border border-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all transform scale-90 group-hover:scale-100"
                              >
                                <Download size={14} /> Save
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewFile && (
        <AttachmentPreviewModal
          url={previewFile.url}
          type={previewFile.type}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </Modal>
  );
};

export default EmployeeLeaveHistoryModal;
