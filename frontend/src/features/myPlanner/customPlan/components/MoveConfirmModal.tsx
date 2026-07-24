import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";

interface Props {
  subjectName: string;
  targetLabel: string;
  type: 'prerequisites' | 'hours' | 'dependents';
  message: string;
  details: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function MoveConfirmModal({ subjectName, targetLabel, type, message, details, onConfirm, onCancel }: Props) {
  const icon = type === 'prerequisites' ? 'swap_horiz' : type === 'hours' ? 'hourglass_top' : 'warning';
  const title = type === 'prerequisites'
    ? 'Reacomodar correlativas'
    : type === 'hours'
      ? 'Límite de horas excedido'
      : 'Reacomodar dependientes';

  const confirmLabel = type === 'prerequisites'
    ? 'Reacomodar automáticamente'
    : type === 'hours'
      ? 'Reubicar materias'
      : 'Reacomodar automáticamente';

  return (
    <Modal isOpen onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-on-surface-variant mb-2">
        Al mover <strong className="text-on-surface">{subjectName}</strong> a {targetLabel}:
      </p>

      <div className="flex items-start gap-3 p-3 bg-warning-container/10 border border-warning-container/30 rounded-xl mb-4">
        <span className="material-symbols-outlined text-warning text-sm mt-0.5">{icon}</span>
        <div>
          <p className="text-sm text-on-surface mb-1">{message}</p>
          {details.length > 0 && (
            <ul className="text-xs text-on-surface-variant space-y-0.5 list-disc list-inside">
              {details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-on-surface-variant/60 mb-6">
        El algoritmo reacomodará las materias automáticamente. Podés deshacer los cambios si no te gusta el resultado.
      </p>

      <div className="flex gap-4">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
