import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

/* ---------- Toasts ---------- */

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}
interface ToastApi {
  notify: (message: string, opts?: { actionLabel?: string; onAction?: () => void; ms?: number }) => void;
}
const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const v = useContext(ToastCtx);
  if (!v) throw new Error('useToast must be used inside <FeedbackProvider>');
  return v;
}

/* ---------- Confirmation dialogs ---------- */

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const v = useContext(ConfirmCtx);
  if (!v) throw new Error('useConfirm must be used inside <FeedbackProvider>');
  return v;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const notify = useCallback<ToastApi['notify']>((message, opts) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts?.ms ?? (opts?.onAction ? 8000 : 4500));
  }, []);

  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback<ConfirmFn>((opts) => new Promise((resolve) => setPending({ ...opts, resolve })), []);

  const answer = (v: boolean) => {
    pending?.resolve(v);
    setPending(null);
  };

  // Resolve as "cancel" if the provider unmounts mid-dialog.
  useEffect(() => () => pending?.resolve(false), [pending]);

  return (
    <ToastCtx.Provider value={{ notify }}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              <span>{t.message}</span>
              {t.actionLabel && t.onAction && (
                <button
                  type="button"
                  className="toast__action"
                  onClick={() => {
                    t.onAction?.();
                    setToasts((x) => x.filter((y) => y.id !== t.id));
                  }}
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
        <Modal open={pending !== null} onClose={() => answer(false)} title={pending?.title ?? ''}>
          <div className="confirm">
            <div className="confirm__msg">{pending?.message}</div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => answer(false)}>
                Cancel
              </button>
              <button type="button" className={`btn ${pending?.danger ? 'btn--danger' : 'btn--primary'}`} onClick={() => answer(true)}>
                {pending?.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </Modal>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}
