import { describe, expect, it } from 'vitest';
import { generatePlan } from './planningAlgorithm';
import type { RawAcademicRecord, RawPlanSubject, RawCorrelativity } from '../model/planner';

describe('generatePlan', () => {
  it('proyecta electivas y UNAHUR como PlannedSubject real (drag & drop), tageadas con block_type', () => {
    const planSubjects: RawPlanSubject[] = [
      {
        id: 1,
        id_study_plan: 1,
        id_subject: 401,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        is_elective: true,
        subject: { name: 'Electiva', code: 'E1', is_unahur: false },
      },
      {
        id: 2,
        id_study_plan: 1,
        id_subject: 402,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Materia UNAHUR', code: 'U1', is_unahur: true },
      },
    ];

    const plan = generatePlan(planSubjects, [], [], 20, 2026, 1);
    const subjects = plan.years.flatMap((year) => year.semesters).flatMap((semester) => semester.subjects);

    expect(subjects).toHaveLength(2);
    const elective = subjects.find((s) => s.plan_subject_id === 1);
    const unahur = subjects.find((s) => s.plan_subject_id === 2);

    // Deben ser materias reales (element_type='subject'), no bloques — así son
    // arrastrables con el mismo mecanismo que cualquier otra materia.
    expect(elective?.element_type).toBe('subject');
    expect(elective?.block_type).toBe('elective');
    expect(unahur?.element_type).toBe('subject');
    expect(unahur?.block_type).toBe('unahur');

    // No debe quedar ningún generic_block (el concepto se eliminó del algoritmo).
    const genericBlocks = plan.years.flatMap((year) => year.semesters).flatMap((s) => s.generic_blocks ?? []);
    expect(genericBlocks).toHaveLength(0);
  });

  it('tags generated content with explicit element types for subjects and events', () => {
    const planSubjects: RawPlanSubject[] = [
      {
        id: 1,
        id_study_plan: 1,
        id_subject: 301,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Física', code: 'F1', is_unahur: false },
      },
      {
        id: 2,
        id_study_plan: 1,
        id_subject: 302,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Química', code: 'Q1', is_unahur: false },
      },
    ];

    const records: RawAcademicRecord[] = [
      {
        id: 30,
        plan_subject_id: 2,
        status: 'pendiente',
        grade: 5,
        regularity_expires_at: '2099-01-01',
        year: 2025,
        semester: 1,
        final_exams: [],
      },
    ];

    const plan = generatePlan(planSubjects, records, [], 20, 2026, 1);
    const generatedSubject = plan.years
      .flatMap((year) => year.semesters)
      .flatMap((semester) => semester.subjects)
      .find((subject) => subject.plan_subject_id === 1) as any;
    const generatedEvent = plan.years
      .flatMap((year) => year.semesters)
      .find((semester) => (semester.events?.length ?? 0) > 0)
      ?.events?.[0] as any;

    expect(generatedSubject?.element_type).toBe('subject');
    expect(generatedEvent?.element_type).toBe('event');
  });

  it('creates a pending-final event for regularized subjects that still need an exam', () => {
    const planSubjects: RawPlanSubject[] = [
      {
        id: 1,
        id_study_plan: 1,
        id_subject: 201,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Análisis', code: 'A1', is_unahur: false },
      },
    ];

    const records: RawAcademicRecord[] = [
      {
        id: 20,
        plan_subject_id: 1,
        status: 'pendiente',
        grade: 5,
        regularity_expires_at: '2099-01-01',
        year: 2025,
        semester: 1,
        final_exams: [],
      },
    ];

    const plan = generatePlan(planSubjects, records, [], 20, 2026, 1);
    const firstSemester = plan.years[0]?.semesters[0];
    const events = (firstSemester as any)?.events ?? [];

    expect(events).toHaveLength(1);
    expect(events[0]?.event_type).toBe('final_exam');
    expect(events[0]?.subject_name).toBe('Análisis');
  });

  it('does not project subjects that are already in course, regularized, or finalized', () => {
    const planSubjects: RawPlanSubject[] = [
      {
        id: 1,
        id_study_plan: 1,
        id_subject: 101,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Cursando', code: 'C1', is_unahur: false },
      },
      {
        id: 2,
        id_study_plan: 1,
        id_subject: 102,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Regularizada', code: 'R1', is_unahur: false },
      },
      {
        id: 3,
        id_study_plan: 1,
        id_subject: 103,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Finalizada', code: 'F1', is_unahur: false },
      },
      {
        id: 4,
        id_study_plan: 1,
        id_subject: 104,
        suggested_year: 1,
        suggested_term: 1,
        weekly_hours: 4,
        credits: 4,
        subject: { name: 'Pendiente', code: 'P1', is_unahur: false },
      },
    ];

    const records: RawAcademicRecord[] = [
      {
        id: 10,
        plan_subject_id: 1,
        status: 'enrolled',
        grade: null,
        regularity_expires_at: null,
        year: 2025,
        semester: 1,
        final_exams: [],
      },
      {
        id: 11,
        plan_subject_id: 2,
        status: 'pendiente',
        grade: 5,
        regularity_expires_at: '2099-01-01',
        year: 2025,
        semester: 1,
        final_exams: [],
      },
      {
        id: 12,
        plan_subject_id: 3,
        status: 'aprobado',
        grade: 8,
        regularity_expires_at: null,
        year: 2025,
        semester: 1,
        final_exams: [],
      },
    ];

    const plan = generatePlan(planSubjects, records, [], 20, 2026, 1);

    const projectedIds = plan.years.flatMap((year) =>
      year.semesters.flatMap((semester) => semester.subjects.map((subject) => subject.plan_subject_id))
    );

    expect(projectedIds).toEqual([4]);
  });

  it('no deja que un bloque genérico (electiva) con correlativas acapare el primer cuatrimestre y desplace materias reales', () => {
    // Reproduce el bug real: 5 electivas de 4hs (20hs en total, exactamente el límite)
    // requieren "Base" (regularidad). Si se ubican ANTES de resolver correlativas
    // (arrancando siempre en el período inicial), llenan 2026-C1 entero y empujan
    // "Base" — que no tiene ningún prerequisito — a un cuatrimestre posterior.
    const base: RawPlanSubject = {
      id: 1, id_study_plan: 1, id_subject: 1,
      suggested_year: 1, suggested_term: 1, weekly_hours: 6, credits: 6,
      subject: { name: 'Base', code: 'BASE-101', is_unahur: false },
    };
    const electives: RawPlanSubject[] = Array.from({ length: 5 }, (_, i) => ({
      id: 2 + i, id_study_plan: 1, id_subject: 2 + i,
      suggested_year: 4, suggested_term: 1, weekly_hours: 4, credits: 4,
      is_elective: true,
      subject: { name: `Electiva ${i + 1}`, code: `EL-${i}`, is_unahur: false },
    }));

    const correlativities: RawCorrelativity[] = electives.map((e, i) => ({
      id: i + 1,
      id_plan_subject_target: e.id,
      id_required_plan_subject: base.id,
      type: 'regularidad',
    }));

    const plan = generatePlan([base, ...electives], [], correlativities, 20, 2026, 1);

    const basePlacement = plan.years
      .flatMap((year) => year.semesters.map((sem) => ({ year: year.year, term: sem.term, sem })))
      .find(({ sem }) => sem.subjects.some((s) => s.plan_subject_id === base.id));

    // "Base" no tiene prerequisitos: debe quedar en el primer cuatrimestre del plan,
    // sin importar cuántas electivas (con correlativas) también existan.
    expect(basePlacement?.year).toBe(2026);
    expect(basePlacement?.term).toBe(1);
  });

  it('el proyecto final (is_final_project) siempre queda al final del cronograma, incluso después de las electivas', () => {
    // Base sin prerequisitos, se cursa temprano y desbloquea todo lo demás.
    const base: RawPlanSubject = {
      id: 1, id_study_plan: 1, id_subject: 1,
      suggested_year: 1, suggested_term: 1, weekly_hours: 6, credits: 6,
      subject: { name: 'Base', code: 'BASE-101', is_unahur: false },
    };
    // El proyecto final requiere Base, pero su cadena es corta: quedaría disponible
    // pronto si solo se mirara su propia correlativa.
    const finalProject: RawPlanSubject = {
      id: 2, id_study_plan: 1, id_subject: 2,
      suggested_year: 4, suggested_term: 2, weekly_hours: 8, credits: 8,
      is_final_project: true,
      subject: { name: 'Proyecto Final', code: 'PF-01', is_unahur: false },
    };
    // 3 electivas que también requieren Base, pero su límite horario las obliga a
    // buscar espacio varios cuatrimestres más adelante.
    const electives: RawPlanSubject[] = Array.from({ length: 3 }, (_, i) => ({
      id: 3 + i, id_study_plan: 1, id_subject: 3 + i,
      suggested_year: 4, suggested_term: 1, weekly_hours: 20, credits: 4,
      is_elective: true,
      subject: { name: `Electiva ${i + 1}`, code: `EL-${i}`, is_unahur: false },
    }));

    const correlativities: RawCorrelativity[] = [finalProject, ...electives].map((s, i) => ({
      id: i + 1,
      id_plan_subject_target: s.id,
      id_required_plan_subject: base.id,
      type: 'regularidad' as const,
    }));

    const plan = generatePlan([base, finalProject, ...electives], [], correlativities, 20, 2026, 1);

    const periodOf = (id: number) =>
      plan.years
        .flatMap((year) => year.semesters.map((sem) => ({ year: year.year, term: sem.term, sem })))
        .find(({ sem }) => sem.subjects.some((s) => s.plan_subject_id === id));

    const finalPeriod = periodOf(finalProject.id)!;
    const electivePeriods = electives.map((e) => periodOf(e.id)!);

    const isAfter = (a: { year: number; term: number }, b: { year: number; term: number }) =>
      a.year > b.year || (a.year === b.year && a.term > b.term);

    for (const electivePeriod of electivePeriods) {
      expect(isAfter(finalPeriod, electivePeriod)).toBe(true);
    }
  });

  it('solo proyecta las electivas de un bloque que el estudiante ya eligió, no todo el pool', () => {
    const planSubjects: RawPlanSubject[] = Array.from({ length: 3 }, (_, i) => ({
      id: 1 + i, id_study_plan: 1, id_subject: 1 + i,
      suggested_year: 4, suggested_term: 1, weekly_hours: 4, credits: 4,
      is_elective: true,
      subject: { name: `Electiva ${i + 1}`, code: `EL-${i}`, is_unahur: false },
    }));

    const electivePoolIds = new Set(planSubjects.map((s) => s.id)); // 1, 2, 3
    const chosenElectiveIds = new Set([2]); // el estudiante eligió solo la #2

    const plan = generatePlan(planSubjects, [], [], 20, 2026, 1, electivePoolIds, chosenElectiveIds);
    const projectedIds = plan.years
      .flatMap((year) => year.semesters)
      .flatMap((semester) => semester.subjects.map((s) => s.plan_subject_id));

    expect(projectedIds).toEqual([2]);
  });

  it('solo proyecta las materias UNAHUR que el estudiante ya eligió, no todo el catálogo', () => {
    const planSubjects: RawPlanSubject[] = Array.from({ length: 4 }, (_, i) => ({
      id: 1 + i, id_study_plan: 1, id_subject: 1 + i,
      suggested_year: 4, suggested_term: 1, weekly_hours: 4, credits: null as unknown as number,
      subject: { name: `UNA-0${i + 1}`, code: `UNA-0${i + 1}`, is_unahur: true },
    }));

    const unahurPoolIds = new Set(planSubjects.map((s) => s.id)); // 1, 2, 3, 4
    const chosenUnahurIds = new Set([3]); // el estudiante eligió solo la #3

    const plan = generatePlan(planSubjects, [], [], 20, 2026, 1, undefined, undefined, unahurPoolIds, chosenUnahurIds);
    const projectedIds = plan.years
      .flatMap((year) => year.semesters)
      .flatMap((semester) => semester.subjects.map((s) => s.plan_subject_id));

    expect(projectedIds).toEqual([3]);
  });
});
