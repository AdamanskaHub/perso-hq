import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Larger panel, used by the focus view. */
  variant?: 'default' | 'focus';
}

/**
 * Built on the native <dialog> element: focus is trapped, Esc closes, and the page behind is inert.
 * Children are only mounted while open, so form state resets each time.
 */
export function Modal({ open, onClose, title, children, variant = 'default' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal modal--${variant}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="modal__panel">
          <header className="modal__head">
            <h2 className="modal__title">{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <IconClose />
            </button>
          </header>
          <div className="modal__body">{children}</div>
        </div>
      )}
    </dialog>
  );
}
