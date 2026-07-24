import { Card } from "@/widgets/ui/Card";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { CareerListItem } from "./CareerListItem";
import type { CareerDraft } from "../hooks/useCareersData";

interface Props {
  filteredCareers: CareerDraft[];
  selectedCareerId: string | null;
  onSelect: (id: string) => void;
  formatInstituteName: (id: string) => string;
  hideHeader?: boolean;
}

export function CareerListPanel({ filteredCareers, selectedCareerId, onSelect, formatInstituteName, hideHeader }: Props) {
  return (
    <Card
      className={`xl:col-span-5 flex flex-col h-full ${hideHeader ? '!rounded-none !border-t-0' : ''}`}
      header={hideHeader ? null : <h2 className="font-title-sm text-title-sm text-on-surface">Listado de carreras</h2>}
      bodyClassName="flex-1 overflow-y-auto space-y-3"
    >
      {filteredCareers.length === 0 ? (
        <EmptyState>No hay carreras que coincidan con la búsqueda.</EmptyState>
      ) : (
        filteredCareers.map((career) => (
          <CareerListItem
            key={career.id}
            career={career}
            isActive={career.id === selectedCareerId}
            onSelect={onSelect}
            formatInstituteName={formatInstituteName}
          />
        ))
      )}
    </Card>
  );
}
