import type {
  Plan,
  SubjectGraph,
  PlannedSubject,
} from "../model/planner";

// Asumo que la función `processMove` ya existe en este archivo.
// La coloco aquí como referencia para el contexto.
export function processMove(
  plan: Plan,
  subjectId: number,
  targetPeriod: { year: number; term: number },
  graph: SubjectGraph,
  limitHours: number,
  minYear?: number
): Plan {
  // ... implementación existente de processMove ...
  // Esta es una implementación de marcador de posición.
  console.log("Ejecutando processMove (lógica principal)...");
  return plan;
}

/**
 * Helper para encontrar una materia en el plan y devolver su ubicación.
 */
function findSubjectInPlan(plan: Plan, subjectId: number): { year: number; term: number } | null {
  for (const year of plan.years) {
    for (const sem of year.semesters) {
      if (sem.subjects.some(s => s.plan_subject_id === subjectId)) {
        return { year: year.year, term: sem.term };
      }
    }
  }
  return null;
}

/**
 * Procesa un movimiento CON FEEDBACK de auto-ajustes.
 * Retorna qué se movió automáticamente.
 */
export function processMoveWithFeedback(
  plan: Plan,
  subjectId: number,
  targetPeriod: { year: number; term: number },
  graph: SubjectGraph,
  limitHours: number,
  minYear?: number
): {
  plan: Plan;
  feedback: {
    movedSubject: string;
    adjustedSubjects: string[];
    warnings: string[];
  };
} {
  const subject = graph.nodes.get(subjectId);
  if (!subject) {
    throw new Error("Materia no encontrada");
  }

  // Rastrear cambios
  const adjustedSubjects: string[] = [];
  const warnings: string[] = [];

  // ✅ VALIDACIÓN CRÍTICA: ¿La materia cabe en ALGÚN lugar?
  if (subject.weekly_hours > limitHours) {
    throw new Error(
      `"${subject.subject_name}" requiere ${subject.weekly_hours}hs semanales, ` +
      `pero tu límite es ${limitHours}hs. Aumentá tu límite de horas.`
    );
  }

  console.log(
    `🔄 [FEEDBACK] Iniciando movimiento de ${subject.subject_name} a ${targetPeriod.year}-C${targetPeriod.term}`
  );

  // GUARDAR ESTADO ORIGINAL para comparar después
  const originalPlan = structuredClone(plan);

  // Ejecutar processMove (que hace toda la recursividad)
  const newPlan = processMove(
    plan,
    subjectId,
    targetPeriod,
    graph,
    limitHours,
    minYear
  );

  // POST-PROCESAMIENTO: detectar qué cambió de período
  const subjectsMoved = new Map<number, { from: { year: number; term: number }; to: { year: number; term: number } }>();

  // Comparar cada materia
  for (const year of originalPlan.years) {
    for (const sem of year.semesters) {
      for (const subj of sem.subjects) {
        const origLoc = { year: year.year, term: sem.term };
        const newLoc = findSubjectInPlan(newPlan, subj.plan_subject_id);

        if (newLoc) {
          const moved =
            origLoc.year !== newLoc.year || origLoc.term !== newLoc.term;

          if (moved && subj.plan_subject_id !== subjectId) {
            // Se movió automáticamente (no fue el movimiento principal)
            subjectsMoved.set(subj.plan_subject_id, { from: origLoc, to: newLoc });
          }
        }
      }
    }
  }

  // Construir lista de materias ajustadas
  for (const [id, movement] of subjectsMoved) {
    const node = graph.nodes.get(id);
    if (node) {
      adjustedSubjects.push(node.subject_name);
      console.log(
        `  📌 Auto-ajustada: ${node.subject_name} (${movement.from.year}-C${movement.from.term} → ${movement.to.year}-C${movement.to.term})`
      );
    }
  }

  // ✅ ADVERTENCIAS
  for (const year of newPlan.years) {
    for (const sem of year.semesters) {
      if (sem.total_hours > limitHours) {
        warnings.push(
          `⚠️ ${year.year}-C${sem.term} supera el límite (${sem.total_hours}hs > ${limitHours}hs). ` +
          `Se removieron materias de menor prioridad.`
        );
      }
    }
  }

  return {
    plan: newPlan,
    feedback: {
      movedSubject: subject.subject_name,
      adjustedSubjects,
      warnings,
    },
  };
}