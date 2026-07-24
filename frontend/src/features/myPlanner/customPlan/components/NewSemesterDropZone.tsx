import { useDroppable } from "@dnd-kit/core";
import type { FC } from "react";

interface Props {
  year: number;
  sem: string;
}

export const NewSemesterDropZone: FC<Props> = ({ year, sem }) => {
  const droppableId = `${year}-${sem}`;
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });

  const ringClass = isOver ? "bg-primary/5 rounded-2xl ring-2 ring-primary" : "border-outline-variant/20";

  return (
    <div className="flex gap-margin">
      <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center border-r-2 border-primary/10">
        <h3 className="font-title-sm text-primary">{sem}</h3>
        <span className="text-[10px] font-label-caps text-on-surface-variant uppercase text-center">0hs</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 border-2 border-dashed rounded-2xl flex items-center justify-center bg-surface-container-low/30 py-6 min-h-[120px] transition-colors ${ringClass}`}
      >
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-xl">add</span>
          <span>Crear nuevo cuatrimestre</span>
        </div>
      </div>
    </div>
  );
};
