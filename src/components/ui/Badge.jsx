import clsx from 'clsx';

const TIERS = {
  critical: { label: 'Critical', bg: 'bg-[rgba(244,63,94,0.15)]', text: 'text-[#f43f5e]', border: 'border-[rgba(244,63,94,0.3)]', dot: 'bg-[#f43f5e]' },
  high:     { label: 'High',     bg: 'bg-[rgba(251,146,60,0.15)]', text: 'text-[#fb923c]', border: 'border-[rgba(251,146,60,0.3)]', dot: 'bg-[#fb923c]' },
  moderate: { label: 'Moderate', bg: 'bg-[rgba(245,158,11,0.15)]', text: 'text-[#f59e0b]', border: 'border-[rgba(245,158,11,0.3)]', dot: 'bg-[#f59e0b]' },
  low:      { label: 'Low',      bg: 'bg-[rgba(16,217,160,0.12)]', text: 'text-[#10d9a0]', border: 'border-[rgba(16,217,160,0.25)]', dot: 'bg-[#10d9a0]' },
};

/**
 * @param {{ tier: 'critical'|'high'|'moderate'|'low', size?: 'sm'|'md', showDot?: boolean }} props
 */
export default function Badge({ tier, size = 'md', showDot = true, className = '' }) {
  const t = TIERS[tier] ?? TIERS.moderate;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold border rounded-full',
        t.bg, t.text, t.border,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className,
      )}
    >
      {showDot && <span className={clsx('rounded-full shrink-0', t.dot, size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5')} />}
      {t.label} Risk
    </span>
  );
}
