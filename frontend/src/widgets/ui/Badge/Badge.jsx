/**
 * Badge - Etiqueta de status
 * Stitch Design System - Academic Precision
 */
export function Badge({
  variant = 'default',
  children,
  className = ''
}) {
  const variants = {
    default: 'bg-surface-container text-on-surface-variant border border-outline-variant',
    success: 'bg-secondary-container text-on-secondary-container',
    warning: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
    error: 'bg-error/10 text-error',
    info: 'bg-primary-container/20 text-primary-container'
  };

  return (
    <span className={`
      inline-flex items-center px-2 py-1
      font-label-caps text-label-caps rounded
      ${variants[variant] || variants.default}
      ${className}
    `}>
      {children}
    </span>
  );
}