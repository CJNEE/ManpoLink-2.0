import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './common';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-lg max-w-sm relative z-[9999]">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDangerous ? 'danger' : 'primary'}
              className="flex-1"
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
