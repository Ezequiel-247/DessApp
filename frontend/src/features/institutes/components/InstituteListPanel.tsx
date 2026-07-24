import { Card } from "@/widgets/ui/Card";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { InstituteListItem } from "./InstituteListItem";
import type { InstituteDraft } from "../hooks/useInstitutesData";

const STATUS_VARIANTS: Record<string, string> = {
  activo: "positive",
  en_revision: "warning",
  inactivo: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  en_revision: "En revisión",
  inactivo: "Inactivo",
};

interface Props {
  filteredRecords: InstituteDraft[];
  selectedRecordId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  hideHeader?: boolean;
}

export function InstituteListPanel({ filteredRecords, selectedRecordId, onSelect, isLoading, hideHeader }: Props) {
  return (
    <Card
      className={`xl:col-span-5 flex flex-col h-full ${hideHeader ? '!rounded-none !border-t-0' : ''}`}
      header={hideHeader ? null : <h2 className="font-title-sm text-title-sm text-on-surface">Listado de institutos</h2>}
      bodyClassName="flex-1 overflow-y-auto space-y-3"
    >
      {isLoading ? (
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 text-center">
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <span
              className="material-symbols-outlined text-[32px] text-primary-container animate-spin"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              progress_activity
            </span>
            <p className="text-body-sm">Actualizando institutos...</p>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState>No hay institutos que coincidan con los filtros.</EmptyState>
      ) : (
        filteredRecords.map((record) => (
          <InstituteListItem
            key={record.id}
            record={record}
            isActive={record.id === selectedRecordId}
            onSelect={onSelect}
            statusVariant={STATUS_VARIANTS[record.status] ?? "neutral"}
            statusLabel={STATUS_LABELS[record.status] ?? record.status}
          />
        ))
      )}
    </Card>
  );
}
