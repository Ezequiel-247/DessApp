import React from "react";
import { SemesterRow } from "./SemesterRow";
import type {
  PlanYear,
  SubjectGraph,
  SubjectClassification,
} from "../model/planner";

interface YearBlockProps {
  yearData: PlanYear;
  readOnly?: boolean;
  graph?: SubjectGraph | null;
  classification?: Map<number, SubjectClassification> | null;
  errorDroppableId: string | null;
  errorMessage: string | null;
  hoursLimit?: number;
}

export function YearBlock({
  yearData,
  readOnly,
  errorDroppableId,
  errorMessage,
  hoursLimit,
}: YearBlockProps) {
  return (
    <div id={`year-${yearData.year}`} className="flex flex-col gap-6 scroll-mt-20">
      {/* Year Header */}
      <div className="flex items-center gap-4">
        <span className="text-display-lg font-display-lg leading-none text-primary/20 select-none">
          {yearData.year}
        </span>
        <div className="h-px flex-1 bg-outline-variant/30"></div>
      </div>

      {/* Semesters */}
      <div className="space-y-8">
        {yearData.semesters.map((sem) => {
          const semName = sem.term === 1 ? "C1" : "C2";
          const droppableId = `${yearData.year}-${semName}`;
          const isError = errorDroppableId === droppableId;

          return (
            <SemesterRow
              key={sem.term}
              semester={sem}
              year={yearData.year}
              readOnly={readOnly}
              isError={isError}
              errorMessage={isError ? errorMessage : undefined}
              hoursLimit={hoursLimit}
            />
          );
        })}
      </div>
    </div>
  );
}