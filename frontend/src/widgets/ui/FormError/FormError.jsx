const iconMap = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
};

const styleMap = {
  error: 'bg-error-container/30 border border-error/50 text-error',
  success: 'bg-secondary-container/20 border border-secondary/50 text-secondary',
  info: 'bg-primary-container/20 border border-primary/50 text-primary',
};

export function FormError({ message, errors, variant = 'error', className = '' }) {
  const keys = errors ? Object.keys(errors) : [];
  const hasMultiple = keys.length > 0;
  const isApiError = hasMultiple && keys.length === 1 && keys[0] === 'api';

  if (!message && !hasMultiple) return null;

  return (
    <div className={`rounded-lg flex items-start gap-sm p-md transition-all ${styleMap[variant]} ${className}`}>
      <span className="material-symbols-outlined flex-shrink-0 text-lg">{iconMap[variant]}</span>
      <div className="space-y-1">
        {hasMultiple && (
          <p className="font-title-sm text-title-sm font-semibold">
            {isApiError
              ? "Error al procesar la solicitud:"
              : "Revisá los siguientes campos:"}
          </p>
        )}
        {isApiError && errors.api && (
          <p className="text-body-sm">{errors.api}</p>
        )}
        {hasMultiple ? (
          <ul className="list-disc pl-sm text-body-sm space-y-1">
            {keys.filter(k => k !== 'api').map((key) => (
              <li key={key}>{errors[key]}</li>
            ))}
            {errors?.api && !isApiError && <li>{errors.api}</li>}
          </ul>
        ) : (
          <p className="font-title-sm text-title-sm font-semibold">{message}</p>
        )}
      </div>
    </div>
  );
}
