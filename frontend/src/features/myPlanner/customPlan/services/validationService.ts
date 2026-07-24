import type {
  Plan,
  SubjectGraph,
  SubjectClassification,
  PrerequisiteStatus,
} from "../model/planner";
import { getPrerequisiteStatus, getGenericBlockHours } from "./planningAlgorithm";
import { findSubjectInPlan } from "./editEngine";

export interface ValidatePlacementResponse {
  valid: boolean;
  reason?: string;
  unmet_requirements?: PrerequisiteStatus[];
}

export interface CascadingImpactItem {
  plan_subject_id: number;
  subject_id: number;
  subject_name: string;
  suggested_year: number;
  suggested_term: number;
}

/**
 * Valida si una materia puede ser colocada en un período específico.
 * Verificación local sin llamadas al backend.
 * 
 * @param graph - Grafo de correlatividades
 * @param classification - Clasificación de materias
 * @param plan - Plan actual
 * @param planSubjectId - ID de la materia a validar
 * @param targetYear - Año destino
 * @param targetTerm - Cuatrimestre destino
 * @returns Objeto de validación con detalle de errores
 */
export function validatePlacementLocal(
  graph: SubjectGraph,
  classification: Map<number, SubjectClassification>,
  plan: Plan,
  planSubjectId: number,
  targetYear: number,
  targetTerm: number
): ValidatePlacementResponse {
  // 1. Verificar que la materia existe en el grafo
  const subject = graph.nodes.get(planSubjectId);
  if (!subject) {
    return { valid: false, reason: "Materia no encontrada" };
  }

  // 2. Verificar que NO está ya asignada en el target
  const currentLocation = findSubjectInPlan(plan, planSubjectId);
  if (currentLocation && currentLocation.year === targetYear && currentLocation.term === targetTerm) {
    return { valid: false, reason: "Ya está asignada en este período" };
  }

  // 3. Verificar correlativas: todas deben estar en períodos anteriores al target
  const prereqStatuses = getPrerequisiteStatus(
    graph,
    plan,
    planSubjectId,
    classification
  );

  // Corregir met: si la correlativa está en el plan en un período anterior al target,
  // se considera cumplida (se cursará antes que la materia movida)
  const corrected = prereqStatuses.map(status => {
    if (status.met) return status;
    const prereqPeriod = findSubjectInPlan(plan, status.required_plan_subject_id);
    if (prereqPeriod) {
      const isBeforeTarget =
        prereqPeriod.year < targetYear ||
        (prereqPeriod.year === targetYear && prereqPeriod.term < targetTerm);
      if (isBeforeTarget) {
        return { ...status, met: true };
      }
    }
    return status;
  });

  const unmetRequirements = corrected.filter(p => !p.met);

  if (unmetRequirements.length > 0) {
    return {
      valid: false,
      reason: `Requisitos no cumplidos: ${unmetRequirements.map(r => r.subject_name).join(", ")}`,
      unmet_requirements: unmetRequirements,
    };
  }

  return { valid: true };
}

/**
 * Obtiene las materias que dependen de una materia movida.
 * Localiza aquellas que quedaron en el mismo período o antes.
 * 
 * @param graph - Grafo de correlatividades
 * @param plan - Plan actual
 * @param planSubjectId - ID de la materia movida
 * @returns Array de IDs de materias afectadas
 */
export function getCascadingImpactLocal(
  graph: SubjectGraph,
  plan: Plan,
  planSubjectId: number
): number[] {
  const subject = graph.nodes.get(planSubjectId);
  if (!subject) return [];

  const affected: number[] = [];
  const movedPeriod = findSubjectInPlan(plan, planSubjectId);

  if (!movedPeriod) return [];

  // Buscar todos los dependientes
  for (const dependentId of subject.required_by) {
    const depPeriod = findSubjectInPlan(plan, dependentId);

    if (depPeriod) {
      // Si el dependiente quedó en el mismo período o antes → afectado
      const isSameOrBefore =
        depPeriod.year < movedPeriod.year ||
        (depPeriod.year === movedPeriod.year && depPeriod.term <= movedPeriod.term);

      if (isSameOrBefore) {
        affected.push(dependentId);
      }
    }
  }

  return affected;
}

export interface MoveFeasibility {
  fitsImmediately: boolean;
  fitsInRange: boolean;
  closestQuarter: number;
  casInRange: { year: number; term: number } | null;
}

/**
 * Verifica si una materia podría caber en los próximos N cuatrimestres.
 * Es una "brújula" heurística para estimar si una cascada será corta o larga,
 * basándose únicamente en la capacidad horaria.
 *
 * @param lookAheadQuarters - Cuántos cuatrimestres hacia adelante buscar (default: 4 = 2 años).
 * @returns Un objeto que describe la viabilidad del movimiento.
 */
export function getMoveFeasibility(
  plan: Plan,
  subjectHours: number,
  limitHours: number,
  startYear: number,
  startTerm: number,
  lookAheadQuarters: number = 4
): MoveFeasibility {
  let currentYear = startYear;
  let currentTerm = startTerm;

  for (let i = 0; i < lookAheadQuarters; i++) {
    const yearPlan = plan.years.find((y) => y.year === currentYear);

    // Si el año no existe en el plan, definitivamente hay espacio.
    if (!yearPlan) {
      return {
        fitsImmediately: i === 0,
        fitsInRange: true,
        closestQuarter: i,
        casInRange: { year: currentYear, term: currentTerm },
      };
    }

    const semesterIndex = currentTerm === 1 ? 0 : 1;
    const semester = yearPlan.semesters[semesterIndex];

    if (semester.total_hours + getGenericBlockHours(semester) + subjectHours <= limitHours) {
      return {
        fitsImmediately: i === 0,
        fitsInRange: true,
        closestQuarter: i,
        casInRange: { year: currentYear, term: currentTerm },
      };
    }

    // Avanzar al siguiente período
    if (currentTerm === 1) {
      currentTerm = 2;
    } else {
      currentTerm = 1;
      currentYear += 1;
    }
  }

  // No se encontró espacio en el rango de búsqueda.
  return {
    fitsImmediately: false,
    fitsInRange: false,
    closestQuarter: lookAheadQuarters,
    casInRange: null,
  };
}
