import { useState, useRef } from 'react';
import { Card, Button } from './common';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  preview?: string;
  label?: string;
  accept?: string;
}

export const ImageUploader = ({
  onUpload,
  preview,
  label = 'Upload Image',
  accept = 'image/*'
}: ImageUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(preview);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    onUpload(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card
      onDragOver={(e: React.DragEvent) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-primary transition-colors"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />


    
      <div className="space-y-4">
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              onClick={() => setPreviewUrl(undefined)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          className="text-center py-8"
        >
          <Upload className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="font-medium mb-1">{label}</p>
          <p className="text-sm text-gray-500">Drag and drop or click to select</p>
        </div>

        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose File
        </Button>
      </div>
    </Card>
  );
};
