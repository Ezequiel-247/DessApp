/**
 * FormField - Label + error wrapper
 */
export function FormField({
  label = "",
  error = "",
  required = false,
  children,
  className = "",
  labelClassName = "",
  stackClassName = "space-y-2",
}) {
  return (
    <label className={`${stackClassName} ${className}`.trim()}>
      {label ? (
        <span
          className={`font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant ${labelClassName}`}
        >
          {label}
          {required ? <span className="text-error"> *</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </label>
  );
}
