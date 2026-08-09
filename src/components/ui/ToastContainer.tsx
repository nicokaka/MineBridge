import React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl backdrop-blur-xl flex items-start gap-3 border shadow-2xl transition-all duration-300 animate-slide-up ${
              isSuccess
                ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(23,221,98,0.15)]'
                : isError
                ? 'bg-slate-900/90 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                : isWarning
                ? 'bg-slate-900/90 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                : 'bg-slate-900/90 border-diamond/40 text-diamond shadow-[0_0_20px_rgba(44,185,168,0.15)]'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 size={18} className="text-emerald-400" />}
              {isError && <XCircle size={18} className="text-red-400" />}
              {isWarning && <AlertTriangle size={18} className="text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info size={18} className="text-diamond" />}
            </div>

            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
              {toast.message && <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
