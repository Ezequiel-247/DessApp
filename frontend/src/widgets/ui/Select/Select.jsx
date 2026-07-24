/**
 * Select - Selector desplegable custom
 * Stitch Design System - Academic Precision
 */
export function Select({
  label = '',
  options = [],
  value = '',
  onChange,
  className = ''
}) {
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label && (
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full px-sm py-xs
          bg-surface-container-lowest
          border border-outline-variant rounded
          text-on-surface font-body-sm text-body-sm
          focus:border-primary focus:ring-1 focus:ring-primary
          outline-none transition-colors cursor-pointer
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}