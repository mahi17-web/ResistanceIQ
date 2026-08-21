import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-[#0B1017]/95 border-[#0BDFA0]/30 text-[#F1F5F9]'
                : t.type === 'warning'
                ? 'bg-[#0B1017]/95 border-[#F3B14D]/30 text-[#F1F5F9]'
                : t.type === 'error'
                ? 'bg-[#0B1017]/95 border-[#E85D7A]/30 text-[#F1F5F9]'
                : 'bg-[#0B1017]/95 border-white/10 text-[#F1F5F9]'
            }`}
          >
            <div className="pt-0.5 flex-shrink-0">
              {t.type === 'success' && <CheckCircle2 size={18} className="text-[#0BDFA0]" />}
              {t.type === 'warning' && <AlertTriangle size={18} className="text-[#F3B14D]" />}
              {t.type === 'error' && <AlertCircle size={18} className="text-[#E85D7A]" />}
              {t.type === 'info' && <Info size={18} className="text-[#8B8CF8]" />}
            </div>

            <div className="flex-1 text-xs">
              {t.title && <div className="font-semibold text-sm mb-0.5">{t.title}</div>}
              <div className="text-[#9AACBE] leading-relaxed">{t.message}</div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-[#7C8A9A] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
