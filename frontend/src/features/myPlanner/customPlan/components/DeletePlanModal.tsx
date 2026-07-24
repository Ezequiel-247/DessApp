import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";

interface Props {
  isOpen: boolean;
  isDeleting: boolean;
  planName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePlanModal({ isOpen, isDeleting, planName, onConfirm, onCancel }: Props) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isLoading={isDeleting}
      title="Eliminar plan"
      description={<>¿Estás seguro de eliminar <strong>"{planName}"</strong>? No podrás recuperarlo.</>}
      confirmLabel={isDeleting ? "Eliminando..." : "Eliminar"}
      cancelLabel="Cancelar"
      variant="danger"
    />
  );
}
