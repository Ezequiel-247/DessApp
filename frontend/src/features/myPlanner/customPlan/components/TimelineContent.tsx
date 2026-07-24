import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useMemo } from "react";
import type { PlannedYear, Plan, SubjectGraph, SubjectClassification } from "../model/planner";
import type { SabbaticalPeriod } from "../services/sabbaticalService";
import { SemesterRow } from "./SemesterRow";
import { SubjectCardContent } from "./SubjectCard";
import { MoveConfirmModal } from "./MoveConfirmModal";
import { useDndTimeline } from "../hooks/useDndTimeline";
import { useYearVisibilityObserver } from "../hooks/useYearVisibilityObserver";
import { NewSemesterDropZone } from "./NewSemesterDropZone";
import { computeTimelineYears } from "../utils/computeTimelineYears";

function sabbaticalKey(year: number, term: number): string {
  return `${year}-${term}`;
}

function semName(term: number): string {
  return term === 1 ? "C1" : "C2";
}

interface Props {
  plan: Plan | null;
  activeYear: number;
  onMoveSubject: (
    subjectId: string,
    sourceYear: number,
    sourceSem: number,
    targetYear: number,
    targetSem: number,
    onError?: (error: string) => void,
  ) => void;
  onMoveFinal?: (
    academicRecordId: number,
    finalExamId: number | undefined,
    targetYear: number,
    targetTerm: number,
    onError?: (error: string) => void,
  ) => void;
  onYearVisible?: (year: number) => void;
  studentId?: number | string;
  hoursLimit?: number;
  readOnly?: boolean;
  graph?: SubjectGraph | null;
  classification?: Map<number, SubjectClassification> | null;
  sabbaticals?: SabbaticalPeriod[];
  onCancelSabbatical?: (year: number, term: number) => void;
}

function YearBlock({
  yearPlan,
  activeYear,
  readOnly,
  errorDroppableId,
  errorMessage,
  newSemesters,
  hoursLimit,
  sabbaticalSet,
  onCancelSabbatical,
}: {
  yearPlan: PlannedYear;
  activeYear: number;
  readOnly?: boolean;
  errorDroppableId: string | null;
  errorMessage: string | null;
  newSemesters?: string[];
  hoursLimit?: number;
  sabbaticalSet?: Set<string>;
  onCancelSabbatical?: (year: number, term: number) => void;
}) {
  return (
    <div id={`year-${yearPlan.year}`} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span
          className={`text-display-lg font-display-lg leading-none transition-colors ${
            yearPlan.year === activeYear ? "text-primary" : "text-primary/50"
          }`}
        >
          {yearPlan.year}
        </span>
        <div className="h-px flex-1 bg-outline-variant/30"></div>
      </div>

      <div className="space-y-8">
        {yearPlan.semesters.map(sem => {
          const name = semName(sem.term);
          const droppableId = `${yearPlan.year}-${name}`;
          const isSabbatical = sabbaticalSet?.has(sabbaticalKey(yearPlan.year, sem.term)) ?? false;
          return (
            <SemesterRow
              key={sem.term}
              semester={sem}
              year={yearPlan.year}
              readOnly={readOnly}
              isError={errorDroppableId === droppableId}
              errorMessage={errorDroppableId === droppableId ? errorMessage ?? undefined : undefined}
              hoursLimit={hoursLimit}
              isSabbatical={isSabbatical}
              onCancelSabbatical={
                isSabbatical && onCancelSabbatical
                  ? () => onCancelSabbatical(yearPlan.year, sem.term)
                  : undefined
              }
            />
          );
        })}

        {newSemesters?.map(sem => (
          <NewSemesterDropZone key={`${yearPlan.year}-${sem}`} year={yearPlan.year} sem={sem} />
        ))}
      </div>
    </div>
  );
}

export function TimelineContent({
  plan: planProp,
  activeYear,
  onMoveSubject,
  onMoveFinal,
  onYearVisible,
  studentId,
  hoursLimit,
  readOnly,
  graph,
  classification,
  sabbaticals,
  onCancelSabbatical,
}: Props) {
  const years = planProp?.years ?? [];
  const {
    activeDrag,
    activeDragFinalName,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    errorDroppableId,
    errorMessage,
    moveConfirmation,
    confirmMove,
    cancelMove,
  } = useDndTimeline(planProp, onMoveSubject, studentId, hoursLimit, graph, classification, sabbaticals, onMoveFinal);

  const sabbaticalSet = useMemo(
    () => new Set((sabbaticals ?? []).map(s => sabbaticalKey(s.year, s.term))),
    [sabbaticals]
  );

  useYearVisibilityObserver(onYearVisible);

  const timeline = useMemo(() => computeTimelineYears(years), [years]);
  const pendingSemestersByYear = useMemo(() => {
    const map = new Map<number, string[]>();
    if (!activeDrag) return map;
    for (const zone of timeline.hiddenSemesters) {
      const list = map.get(zone.year) ?? [];
      list.push(zone.sem);
      map.set(zone.year, list);
    }
    return map;
  }, [activeDrag, timeline.hiddenSemesters]);

  const futureSemesterZones = useMemo(
    () => (activeDrag ? timeline.futureSemesters : []),
    [activeDrag, timeline.futureSemesters]
  );

  return (
    <section className="bg-slate-50/50">
      <div className="p-margin space-y-xl">
        {readOnly ? (
          timeline.visibleYears.map(yearPlan => (
            <YearBlock
              key={yearPlan.year}
              yearPlan={yearPlan}
              activeYear={activeYear}
              readOnly
              errorDroppableId={null}
              errorMessage={null}
              sabbaticalSet={sabbaticalSet}
            />
          ))
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {timeline.visibleYears.map(yearPlan => (
              <YearBlock
                key={yearPlan.year}
                yearPlan={yearPlan}
                activeYear={activeYear}
                errorDroppableId={errorDroppableId}
                errorMessage={errorMessage}
                newSemesters={pendingSemestersByYear.get(yearPlan.year)}
                hoursLimit={hoursLimit}
                sabbaticalSet={sabbaticalSet}
                onCancelSabbatical={onCancelSabbatical}
              />
            ))}

            {futureSemesterZones.length > 0 && (
              <div key={`new-year-${futureSemesterZones[0].year}`} className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <span className={`text-display-lg font-display-lg leading-none text-primary/50`}>
                    {futureSemesterZones[0].year}
                  </span>
                  <div className="h-px flex-1 bg-outline-variant/30"></div>
                </div>
                <div className="space-y-8">
                  {futureSemesterZones.map(({ year, sem }) => (
                    <NewSemesterDropZone key={`${year}-${sem}`} year={year} sem={sem} />
                  ))}
                </div>
              </div>
            )}

            <DragOverlay>
              {activeDrag ? (
                <SubjectCardContent subject={activeDrag} />
              ) : activeDragFinalName ? (
                <div className="flex-1 min-w-[180px] max-w-[280px] border border-amber-300/60 bg-amber-50 p-2 rounded-xl shadow-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">event_note</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-title-sm text-amber-900 truncate">Final de {activeDragFinalName}</div>
                    <div className="text-body-sm text-amber-700">Pendiente</div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {!readOnly && moveConfirmation && (
        <MoveConfirmModal
          subjectName={moveConfirmation.subjectName}
          targetLabel={moveConfirmation.targetLabel}
          type={moveConfirmation.type}
          message={moveConfirmation.message}
          details={moveConfirmation.details}
          onConfirm={confirmMove}
          onCancel={cancelMove}
        />
      )}

    </section>
  );
}
