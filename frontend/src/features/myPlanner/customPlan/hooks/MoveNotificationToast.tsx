import { useEffect, useState } from "react";

interface MoveNotificationToastProps {
  movedSubject: string;
  adjustedSubjects: string[];
  warnings: string[];
  isVisible?: boolean;
  onDismiss?: () => void;
}

export function MoveNotificationToast({
  movedSubject,
  adjustedSubjects,
  warnings,
  isVisible = true,
  onDismiss,
}: MoveNotificationToastProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    if (isVisible) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-surface border border-outline-variant rounded-xl shadow-lg p-4 max-w-sm space-y-3 animate-in fade-in slide-in-from-bottom-4 z-40">
      {/* Main message */}
      <div className="flex gap-3 items-start">
        <span className="material-symbols-outlined text-success text-2xl flex-shrink-0">
          check_circle
        </span>
        <div className="flex-1">
          <div className="font-semibold text-on-surface">
            Se movió <span className="text-primary">{movedSubject}</span>
          </div>
          <div className="text-xs text-on-surface-variant">
            Movimiento procesado correctamente
          </div>
        </div>
        <button
          onClick={() => {
            setShow(false);
            onDismiss?.();
          }}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Auto-ajustes */}
      {adjustedSubjects.length > 0 && (
        <div className="bg-primary-container/20 rounded-lg p-3 border border-primary/20">
          <div className="text-xs font-semibold text-primary mb-2">
            📌 Se reacomodaron automáticamente:
          </div>
          <ul className="text-xs text-on-surface-variant space-y-1">
            {adjustedSubjects.map((name) => (
              <li key={name} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary"></span>
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-warning-container/20 rounded-lg p-3 border border-warning/20">
          <div className="text-xs font-semibold text-warning flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">warning</span>
            Nota importante:
          </div>
          <div className="text-xs text-on-surface-variant mt-1 space-y-1">
            {warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}