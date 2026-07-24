import { useState } from "react";
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";

type MoveSubjectHandler = (
  subjectId: string,
  sourceYear: number,
  sourceSem: number,
  targetYear: number,
  targetSem: number,
  onError?: (error: string) => void
) => void;

export function useDndTimeline(moveSubject: MoveSubjectHandler, onError: (msg: string) => void) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const [s_year, s_sem] = active.data.current.period.split("-");
      const [t_year, t_sem] = over.id.split("-");
      moveSubject(active.id, Number(s_year), Number(s_sem), Number(t_year), Number(t_sem), onError);
    }
    setActiveId(null);
  };

  return { activeId, sensors, handleDragStart, handleDragEnd };
}