import React, { useMemo, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useDndTimeline } from "../hooks/useDndTimeline";
import { DraggableSubject } from "../customPlan/services/DraggableSubject";
import { DroppableSemester } from "./DroppableSemester";
import type { Plan, SubjectGraph, SubjectClassification } from "../customPlan/model/planner";

interface TimelineContentProps {
  plan: Plan;
  activeYear: number;
  onYearVisible: (year: number) => void;
  moveSubject: (
    subjectId: string,
    sourceYear: number,
    sourceSem: number,
    targetYear: number,
    targetSem: number,
    onError?: (error: string) => void
  ) => void;
  studentId?: string;
  hoursLimit: number;
  readOnly: boolean;
  graph: SubjectGraph | null;
  classification: Map<number, SubjectClassification> | null;
  lastFeedback: {
    movedSubject: string;
    adjustedSubjects: string[];
    warnings: string[];
  } | null;
}

export function TimelineContent({
  plan,
  activeYear,
  onYearVisible,
  moveSubject,
  readOnly,
  graph,
  classification,
  lastFeedback,
}: TimelineContentProps) {
  const { activeId, sensors, handleDragStart, handleDragEnd } = useDndTimeline(
    moveSubject,
    (error) => toast.error(error)
  );

  const yearRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const year = Number(entry.target.getAttribute("data-year"));
            if (year) {
              onYearVisible(year);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const currentRefs = yearRefs.current;
    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [plan.years, onYearVisible]);

  const activeSubject = useMemo(() => {
    if (!activeId) return null;
    for (const year of plan.years) {
      for (const sem of year.semesters) {
        const subject = sem.subjects.find(
          (s) => String(s.plan_subject_id) === String(activeId)
        );
        if (subject) return subject;
      }
    }
    return null;
  }, [activeId, plan.years]);

  const adjustedSubjects = useMemo(() => {
    return new Set(lastFeedback?.adjustedSubjects ?? []);
  }, [lastFeedback]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-y-auto p-gutter">
        {plan.years.map((year) => (
          <div
            key={year.year}
            ref={(el) => yearRefs.current.set(year.year, el)}
            data-year={year.year}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-on-surface mb-4">{year.year}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {year.semesters.map((sem) => (
                <DroppableSemester
                  key={`${year.year}-${sem.term}`}
                  id={`${year.year}-${sem.term}`}
                  year={year.year}
                  term={sem.term}
                  subjects={sem.subjects}
                  totalHours={sem.total_hours}
                  readOnly={readOnly}
                  graph={graph}
                  classification={classification}
                  plan={plan}
                  isAdjusted={(subjectName: string) => adjustedSubjects.has(subjectName)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeSubject ? (
          <DraggableSubject
            id={String(activeSubject.plan_subject_id)}
            name={activeSubject.subject_name}
            hours={activeSubject.weekly_hours}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}