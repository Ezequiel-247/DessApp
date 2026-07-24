/**
 * SearchInput - Input con icono de busqueda
 */
/**
 * @typedef {Object} SearchInputProps
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {string} [placeholder]
 * @property {string} [className]
 * @property {string} [inputClassName]
 */
export function SearchInput(
  /** @type {SearchInputProps} */ {
    value,
    onChange,
    placeholder = "Buscar",
    className = "",
    inputClassName = "",
  }
) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Buscar</span>
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: "24px" }}>
        search
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded border border-outline-variant bg-surface-container-lowest px-4 py-1.5 pl-11 pr-4  text-on-surface outline-none transition-colors focus:border-primary-container focus:ring-2 focus:ring-primary/15 ${inputClassName}`}
      />
    </label>
  );
}
