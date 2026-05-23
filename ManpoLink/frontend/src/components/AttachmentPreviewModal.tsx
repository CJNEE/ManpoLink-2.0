import React from 'react';
import { X, Download } from 'lucide-react';

interface AttachmentPreviewModalProps {
  url: string;
  type: 'image' | 'pdf' | 'other';
  onClose: () => void;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({ url, type, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/50 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            File Preview
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              title="Download File"
            >
              <Download size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-950">
          {type === 'image' ? (
            <img
              src={url}
              alt="Preview"
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          ) : type === 'pdf' ? (
            <iframe
              src={url}
              title="PDF Preview"
              className="w-full h-full min-h-[70vh] rounded-lg"
            />
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-400 mb-6 font-medium">This file type cannot be previewed directly.</p>
              <a
                href={url}
                download
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
              >
                Download to View
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
