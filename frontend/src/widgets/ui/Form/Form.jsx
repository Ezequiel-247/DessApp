function Row({ cols = 1, className = '', children }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[cols] || 'grid-cols-1'} gap-gutter ${className}`}>
      {children}
    </div>
  );
}

function Field({
  label = '',
  error = '',
  required = false,
  visible = true,
  className = '',
  children,
}) {
  return (
    <div className={`flex flex-col gap-3 ${!visible ? 'invisible' : ''} ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </span>
      )}
      {children}
      {error && (
        <span className="text-sm text-error">{error}</span>
      )}
    </div>
  );
}

export function Form({ children, className = '' }) {
  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {children}
    </div>
  );
}

Form.Row = Row;
Form.Field = Field;
