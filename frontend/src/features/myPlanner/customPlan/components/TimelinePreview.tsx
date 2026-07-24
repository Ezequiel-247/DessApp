import { useMemo } from "react";
import type { Plan, PlannedSemester } from "../model/planner";
import { SubjectCardReadOnly, CompletedSubjectCard } from "./SubjectCard";
import { FinalExamCardReadOnly } from "./FinalExamCard";
import { computeTimelineYears } from "../utils/computeTimelineYears";

function semName(term: number): string {
  return term === 1 ? "C1" : "C2";
}

interface Props {
  data: Plan;
}

function SemesterRowPreview({ name, semester }: { name: string; semester: PlannedSemester }) {
  const isEmpty =
    semester.subjects.length === 0 &&
    (semester.events?.length ?? 0) === 0 &&
    (semester.completed_subjects?.length ?? 0) === 0;

  return (
    <div className="flex gap-margin">
      <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center border-r-2 border-primary/10">
        <h3 className="font-title-sm text-primary">{name}</h3>
        <span className="text-[10px] font-label-caps text-on-surface-variant uppercase text-center">{semester.total_hours}hs</span>
      </div>
      <div className="flex-1 flex gap-4 flex-wrap">
        {isEmpty ? (
          <div className="flex-1 border-2 border-dashed rounded-2xl flex items-center justify-center bg-surface-container-low/30 py-6 min-h-[120px] border-outline-variant/20">
            <span className="text-xs text-on-surface-variant/50 italic">Sin materias</span>
          </div>
        ) : (
          <>
            {(semester.completed_subjects ?? []).map((subject) => (
              <CompletedSubjectCard key={subject.plan_subject_id} subject={subject} />
            ))}
            {semester.subjects.map((subject) => (
              <SubjectCardReadOnly key={subject.plan_subject_id} subject={subject} />
            ))}
            {(semester.events ?? []).map((event) => (
              <FinalExamCardReadOnly key={`${event.event_type}-${event.academic_record_id}`} event={event} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function TimelinePreview({ data }: Props) {
  const timeline = useMemo(() => computeTimelineYears(data.years), [data.years]);

  return (
    <section className="overflow-y-auto h-full">
      <div className="p-margin space-y-xl">
        {timeline.visibleYears.map((yearPlan) => (
          <div key={yearPlan.year} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="text-display-lg font-display-lg leading-none text-primary/20">{yearPlan.year}</span>
              <div className="h-px flex-1 bg-outline-variant/30"></div>
            </div>

            <div className="space-y-8">
              {yearPlan.semesters.map((sem) => (
                <SemesterRowPreview
                  key={sem.term}
                  name={semName(sem.term)}
                  semester={sem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-4 border-t border-outline-variant/20">
        <span className="text-xs text-on-surface-variant/50 italic">
          Vista previa — Entrá al plan para verlo completo
        </span>
      </div>
    </section>
  );
}
