import { useEffect, useId } from 'react';
import Icon from './Icon';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

// Accessible dialog: closes on Escape / backdrop click, locks page scroll while open
export default function Modal({ open, title, onClose, children, size = 'md' }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={`max-h-[92vh] w-full ${SIZES[size]} overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Confirmation dialog used before every delete
export function ConfirmModal({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', loading, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
