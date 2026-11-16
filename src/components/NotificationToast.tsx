import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface NotificationToastProps {
  message: string | null;
  onClose: () => void;
}

export function NotificationToast({ message, onClose }: NotificationToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 border border-emerald-500 text-xs font-semibold backdrop-blur-md">
        <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-emerald-700 text-emerald-100 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
