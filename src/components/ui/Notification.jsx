import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import useProjectStore from '../../store/projectStore.js';

const VARIANTS = {
  success: {
    Icon: CheckCircle,
    color:  '#06d6a0',
    bg:     'rgba(6,214,160,0.08)',
    border: 'rgba(6,214,160,0.22)',
    progress: '#06d6a0',
  },
  error: {
    Icon: XCircle,
    color:  '#f43f5e',
    bg:     'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.25)',
    progress: '#f43f5e',
  },
  warning: {
    Icon: AlertTriangle,
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    progress: '#f59e0b',
  },
  info: {
    Icon: Info,
    color:  '#818cf8',
    bg:     'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    progress: '#818cf8',
  },
};

const DISMISS_MS = 5000;

function ToastItem({ notification }) {
  const dismiss = useProjectStore((s) => s.dismissNotification);
  const { type = 'info', message, detail, id } = notification;
  const { Icon, color, bg, border, progress } = VARIANTS[type] ?? VARIANTS.info;

  useEffect(() => {
    const t = setTimeout(() => dismiss(id), DISMISS_MS);
    return () => clearTimeout(t);
  }, [id, dismiss]);

  return (
    <div
      className="toast animate-toast-in"
      style={{ background: bg, borderColor: border }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={15} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[13px] font-semibold text-[#edf2ff] leading-snug">{message}</p>
        {detail && (
          <p className="text-[11px] text-[#607a9a] mt-0.5 leading-snug truncate">{detail}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        aria-label="Dismiss notification"
        onClick={() => dismiss(id)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[#4e6280] hover:text-[#edf2ff] hover:bg-[rgba(255,255,255,0.08)] transition-all self-start"
      >
        <X size={12} />
      </button>

      {/* Progress bar */}
      <div
        className="toast-progress"
        style={{
          background: progress,
          animation: `toastProgress ${DISMISS_MS}ms linear forwards`,
        }}
      />
    </div>
  );
}

/**
 * Global notification tray — fixed bottom-right.
 */
export default function NotificationTray() {
  const notifications = useProjectStore((s) => s.notifications);
  if (!notifications.length) return null;

  return (
    <div
      id="notification-tray"
      className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2.5 pointer-events-none"
    >
      {notifications.slice(0, 5).map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <ToastItem notification={n} />
        </div>
      ))}
    </div>
  );
}
