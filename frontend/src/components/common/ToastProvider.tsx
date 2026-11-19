import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string; dedupeKey?: string; }
interface ToastContextValue { showToast: (kind: ToastKind, message: string, dedupeKey?: string) => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const recentKeys = useRef(new Map<string, number>());
  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts(items => items.filter(item => item.id !== id));
  }, []);
  const showToast = useCallback((kind: ToastKind, message: string, dedupeKey?: string) => {
    const now = Date.now();
    if (dedupeKey) {
      const previous = recentKeys.current.get(dedupeKey);
      if (previous && now - previous < 3000) return;
      recentKeys.current.set(dedupeKey, now);
    }
    const id = ++nextId.current;
    setToasts(items => [...items, { id, kind, message, dedupeKey }].slice(-4));
    timers.current.set(id, setTimeout(() => dismiss(id), 3000));
  }, [dismiss]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <div aria-live="polite" aria-atomic="false" className="fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map(toast => {
        const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info;
        const palette = toast.kind === 'success' ? 'border-sage-200 bg-white text-neutral-800' : toast.kind === 'error' ? 'border-coral-200 bg-white text-neutral-800' : 'border-neutral-200 bg-white text-neutral-800';
        const iconColor = toast.kind === 'success' ? 'text-sage-700' : toast.kind === 'error' ? 'text-coral-700' : 'text-neutral-600';
        return <div key={toast.id} role={toast.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-neutral-900/10 animate-in fade-in slide-in-from-bottom-2 ${palette}`}>
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} aria-hidden="true" />
          <p className="min-w-0 flex-1 text-xs leading-5">{toast.message}</p>
          <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)} className="-mr-1 -mt-1 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800"><X className="h-3.5 w-3.5" /></button>
        </div>;
      })}
    </div>
  </ToastContext.Provider>;
};
