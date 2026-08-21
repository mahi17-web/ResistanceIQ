import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Premium modal with backdrop blur and refined animation.
 * @param {{ open: boolean, onClose: () => void, title: string, children: React.ReactNode }} props
 */
export default function Modal({ open, onClose, title, children }) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="text-[15px] font-bold text-[#edf2ff]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4e6280] hover:text-[#edf2ff] hover:bg-[rgba(255,255,255,0.07)] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
