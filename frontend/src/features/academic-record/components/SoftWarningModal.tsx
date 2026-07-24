import { useState } from "react";
import { Modal } from "@/widgets/ui/Modal";

interface SoftWarningModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  storageKey: string;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export function SoftWarningModal({
  isOpen,
  title,
  message,
  storageKey,
  onConfirm,
  onCancel,
}: SoftWarningModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="space-y-md">
        <p className="text-body-md text-on-surface-variant">{message}</p>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <span className="text-body-sm text-on-surface-variant">No volver a mostrar</span>
        </label>

        <div className="flex gap-sm justify-end pt-sm">
          <button
            onClick={onCancel}
            className="rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container px-6 py-2.5 font-title-sm text-title-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(dontShowAgain)}
            className="rounded-lg bg-primary text-on-primary hover:bg-primary-container px-6 py-2.5 font-title-sm text-title-sm transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
}
