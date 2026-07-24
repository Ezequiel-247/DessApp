import React from 'react';

interface DraggableSubjectProps {
  id: string;
  name?: string;
  hours?: number;
  isDragging?: boolean;
  isAdjusted?: boolean;
}

export function DraggableSubject({ name, hours, isDragging, isAdjusted }: DraggableSubjectProps) {
  const style = isDragging
    ? 'shadow-2xl scale-105 cursor-grabbing ring-2 ring-primary'
    : 'shadow-md cursor-grab';

  const adjustedStyle = isAdjusted
    ? 'bg-primary-container/20 border-primary/30'
    : 'bg-surface-container-high border-outline-variant/50';

  return (
    <div
      className={`p-3 rounded-lg border w-full min-w-[180px] ${style} ${adjustedStyle} transition-all duration-150 ease-in-out touch-none select-none`}
    >
      <div className="font-semibold text-sm text-on-surface truncate">{name ?? 'Materia'}</div>
      {hours != null && <div className="text-xs text-on-surface-variant mt-1">{hours} hs. semanales</div>}
    </div>
  );
}