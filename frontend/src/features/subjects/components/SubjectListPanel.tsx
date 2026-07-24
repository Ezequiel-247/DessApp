import { Card } from "@/widgets/ui/Card";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { SubjectListItem } from "./SubjectListItem";
import type { Subject } from "@/entities/Subject";

interface Props {
  subjects: Subject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hideHeader?: boolean;
}

export function SubjectListPanel({ subjects, selectedId, onSelect, hideHeader }: Props) {
  return (
    <Card
      className={`xl:col-span-5 flex flex-col h-full ${hideHeader ? '!rounded-none !border-t-0' : ''}`}
      header={hideHeader ? null : <h2 className="font-title-sm text-title-sm text-on-surface">Listado de materias</h2>}
      bodyClassName="flex-1 overflow-y-auto space-y-3"
    >
      {subjects.length === 0 ? (
        <EmptyState>No hay materias cargadas.</EmptyState>
      ) : (
        subjects.map((s) => (
          <SubjectListItem
            key={s.id}
            subject={s}
            isActive={s.id === selectedId}
            onSelect={onSelect}
          />
        ))
      )}
    </Card>
  );
}
