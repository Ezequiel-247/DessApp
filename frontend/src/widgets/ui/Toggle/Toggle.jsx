/**
 * Toggle - Switch on/off
 * Stitch Design System - Academic Precision
 */
export function Toggle({
  checked = false,
  onChange,
  label,
  description = '',
  className = '',
  disabled = false,
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'cursor-default' : 'cursor-pointer'} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 rounded-full border-2
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-lowest
          ${disabled ? 'opacity-50 cursor-default' : ''}
          ${checked ? 'bg-primary border-transparent' : 'bg-surface-variant border-outline-variant'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full shadow
            transition duration-300 ease-in-out border 
            ${checked ? 'translate-x-5 bg-on-primary' : 'translate-x-0 bg-outline'}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-base font-medium text-on-surface">
              {label}
            </span>
          )}
          {description && (
            <span className="text-sm text-on-surface-variant">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}