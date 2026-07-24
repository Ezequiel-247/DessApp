export function InputSelect({ className = '', error, disabled, children, ...props }) {
  return (
    <label className="relative block">
      <select
        disabled={disabled}
        className={`peer w-full px-4 py-3 pr-10 appearance-none rounded-lg border bg-surface-bright text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${error ? "border-error focus:border-error focus:ring-1 focus:ring-error" : "border-outline-variant"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
        {...props}
      >
        {children}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline transition-transform duration-300 peer-focus:rotate-180">
        expand_more
      </span>
    </label>
  );
}

export function Input({
  label,
  type = "text",
  error = "",
  helper = "",
  disabled = false,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        disabled={disabled}
        className={`
          w-full px-4 py-3
          bg-surface-bright
          font-medium rounded border border-outline-variant
          text-primary text-sm
          placeholder:text-outline
          cursor-pointer
          transition-colors duration-300
          ${error
            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
            : "focus:border-primary focus:ring-1 focus:ring-primary"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          focus:outline-none
        `}
        {...props}
      />
      {error && (
        <span className="text-sm text-error">{error}</span>
      )}
      {helper && !error && (
        <span className="text-sm text-outline">{helper}</span>
      )}
    </div>
  );
}
