import type { PlannedYear, PlannedSemester } from "../model/planner";

export interface NewSemesterZone {
  year: number;
  sem: string;
}

export interface TimelineRenderData {
  visibleYears: PlannedYear[];
  hiddenSemesters: NewSemesterZone[];
  futureSemesters: NewSemesterZone[];
}

function createEmptySemester(term: number): PlannedSemester {
  return { term, subjects: [], total_hours: 0, events: [] };
}

function hasSemesterData(s?: PlannedSemester): boolean {
  return !!s?.subjects.length || !!s?.events?.length || !!s?.completed_subjects?.length;
}

export function cleanupTimelineYears(years: PlannedYear[]): PlannedYear[] {
  return years
    .map((y) => ({
      ...y,
      semesters: y.semesters.filter((s) => hasSemesterData(s)),
    }))
    .filter((y) => y.semesters.length > 0);
}

export function computeTimelineYears(years: PlannedYear[]): TimelineRenderData {
  const sortedYears = [...years].sort((a, b) => a.year - b.year);
  const dataYears = sortedYears.filter((y) => y.semesters.some((s) => hasSemesterData(s)));
  if (dataYears.length === 0) {
    return { visibleYears: [], hiddenSemesters: [], futureSemesters: [] };
  }

  const firstYear = dataYears[0].year;
  const lastYear = dataYears[dataYears.length - 1].year;
  const yearMap = new Map<number, PlannedYear>(sortedYears.map((y) => [y.year, y]));
  const visibleYears: PlannedYear[] = [];
  const hiddenSemesters: NewSemesterZone[] = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    const original = yearMap.get(year);
    const c1 = original?.semesters.find((s) => s.term === 1);
    const c2 = original?.semesters.find((s) => s.term === 2);
    const hasC1Data = hasSemesterData(c1);
    const hasC2Data = hasSemesterData(c2);
    const hasFuture = year < lastYear;

    if (!hasC1Data && !hasC2Data) {
      visibleYears.push({ year, semesters: [] });
      continue;
    }

    const semesters: PlannedSemester[] = [];

    if (hasC1Data) {
      semesters.push(c1 ?? createEmptySemester(1));
    } else if (hasC2Data) {
      semesters.push(createEmptySemester(1));
    }

    if (hasC2Data) {
      semesters.push(c2 ?? createEmptySemester(2));
    } else if (hasC1Data && hasFuture) {
      semesters.push(createEmptySemester(2));
    } else if (hasC1Data && !hasFuture) {
      hiddenSemesters.push({ year, sem: "C2" });
    }

    visibleYears.push({ year, semesters });
  }

  const futureSemesters: NewSemesterZone[] = [
    { year: lastYear + 1, sem: "C1" },
    { year: lastYear + 1, sem: "C2" },
  ];

  return { visibleYears, hiddenSemesters, futureSemesters };
}
