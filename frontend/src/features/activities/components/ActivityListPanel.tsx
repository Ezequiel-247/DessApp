import { Card } from "@/widgets/ui/Card";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { ActivityListItem } from "./ActivityListItem";
import type { Activity } from "@/entities/Activity";

interface Props {
  activities: Activity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hideHeader?: boolean;
}

export function ActivityListPanel({ activities, selectedId, onSelect, hideHeader }: Props) {
  return (
    <Card
      className={`xl:col-span-5 flex flex-col h-full ${hideHeader ? '!rounded-none !border-t-0' : ''}`}
      header={hideHeader ? null : <h2 className="font-title-sm text-title-sm text-on-surface">Listado de actividades</h2>}
      bodyClassName="flex-1 overflow-y-auto space-y-3"
    >
      {activities.length === 0 ? (
        <EmptyState>No hay actividades cargadas.</EmptyState>
      ) : (
        activities.map((a) => (
          <ActivityListItem
            key={a.id}
            activity={a}
            isActive={a.id === selectedId}
            onSelect={onSelect}
          />
        ))
      )}
    </Card>
  );
}
