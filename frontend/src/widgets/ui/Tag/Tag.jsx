const VARIANTS = {
  positive: 'bg-secondary/10 text-secondary',
  info: 'bg-primary/10 text-primary',
  danger: 'bg-error/10 text-error',
  warning: 'bg-tertiary/10 text-tertiary',
  neutral: 'bg-slate-100 text-slate-400',
};

export function Tag({ variant = 'info', children, className = '' }) {
  return (
    <span className={`uppercase px-2 py-0.5 rounded font-label-caps text-[10px] ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
