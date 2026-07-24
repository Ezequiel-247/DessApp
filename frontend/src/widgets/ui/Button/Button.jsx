/**
 * Button - Componente de botón
 * Stitch Design System - Academic Precision
 */
export function Button({
  variant = 'primary',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary';

  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary-container px-4 py-1.5 text-xs font-semibold cursor-pointer active:scale-[0.98]',
    secondary: 'border border-outline-variant text-primary hover:bg-surface-container px-4 py-1.5 text-xs font-semibold cursor-pointer active:scale-[0.98]',
    
    danger: 'bg-error text-on-error hover:bg-error/90 px-4 py-1.5 text-xs font-semibold cursor-pointer active:scale-[0.98]',
    warning: 'bg-tertiary text-on-tertiary hover:bg-tertiary-container hover:text-on-tertiary px-4 py-1.5 text-xs font-semibold cursor-pointer active:scale-[0.98]',
   
    ghost: 'text-on-surface-variant hover:bg-surface-container-lowest px-4 py-1.5 text-xs font-semibold cursor-pointer active:scale-[0.98]',
  };

  return (
    <button
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}