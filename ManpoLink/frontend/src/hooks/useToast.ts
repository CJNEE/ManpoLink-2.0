import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useToast = () => {
  return {
    success: useCallback((message: string) => {
      toast.success(message, {
        position: 'bottom-right',
        duration: 3000,
      });
    }, []),
    
    error: useCallback((message: string) => {
      toast.error(message, {
        position: 'bottom-right',
        duration: 3000,
      });
    }, []),
    
    loading: useCallback((message: string) => {
      return toast.loading(message, {
        position: 'bottom-right',
      });
    }, []),
    
    dismiss: useCallback((toastId: string) => {
      toast.dismiss(toastId);
    }, []),
  };
};
