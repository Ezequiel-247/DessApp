const VARIANTS = {
  positive: 'bg-secondary-container/10 text-secondary',
  warning: 'bg-tertiary-fixed-dim/20 text-tertiary-container',
  danger: 'bg-error-container/30 text-error',
  info: 'bg-primary-fixed/30 text-primary',
  neutral: 'bg-slate-100 text-slate-400',
};

export function StatusBadge({ variant = 'neutral', label = '', className = '' }) {
  return (
    <span className={`uppercase inline-flex items-center rounded-full px-3 py-1 font-label-caps text-[10px] ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}>
      {label}
    </span>
  );
}
