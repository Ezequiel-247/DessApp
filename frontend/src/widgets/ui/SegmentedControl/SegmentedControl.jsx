export function SegmentedControl({ value, onChange, options = [], className = '' }) {
  return (
    <div className={`flex bg-slate-100 rounded-lg p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
            option.disabled
              ? "opacity-40 cursor-not-allowed text-on-surface-variant"
              : value === option.value
                ? "bg-white text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
