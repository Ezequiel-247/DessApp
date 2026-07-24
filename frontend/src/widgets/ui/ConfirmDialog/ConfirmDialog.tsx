import { type ReactNode } from "react";
import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-sm">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>
            <span className="material-symbols-outlined">arrow_back</span>
            {cancelLabel}
          </Button>
          <Button variant={variant === "primary" ? "primary" : variant} className="flex-1" onClick={onConfirm} disabled={isLoading}>
            {variant === "danger" && <span className="material-symbols-outlined">delete</span>}
            {isLoading && (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {description && (
        <div className="flex items-start gap-4">
          {(variant === "danger" || variant === "warning") && (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variant === "danger" ? "bg-error-container/20" : "bg-tertiary-fixed-dim/30"}`}>
              <span className={`material-symbols-outlined ${variant === "danger" ? "text-error" : "text-tertiary"}`}>
                {variant === "danger" ? "delete" : "warning"}
              </span>
            </div>
          )}
          <p className="text-body-md text-on-surface-variant flex-1">{description}</p>
        </div>
      )}
    </Modal>
  );
}
