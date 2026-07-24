/**
 * EmptyState - Estado vacio
 */
export function EmptyState({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant ${className}`}
    >
      {children}
    </div>
  );
}
