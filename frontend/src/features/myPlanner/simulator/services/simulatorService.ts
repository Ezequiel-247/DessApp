import type {
  SubjectGraph,
  SubjectClassification,
} from "@/features/myPlanner/customPlan/model/planner";
import { getAvailableSubjects } from "@/features/myPlanner/customPlan/services/planningAlgorithm";
import type {
  SimEnrolledSubject,
  SimUnlockedSubject,
  SimulateResponse,
} from "../model/simulator";

/**
 * Simula el escenario "¿Qué pasa si?" completamos ciertos materias.
 * Versión local sin llamadas al backend.
 * 
 * @param graph - Grafo de correlatividades
 * @param classification - Clasificación actual de materias
 * @param simulatedCompletedIds - IDs de materias a simular como completadas
 * @returns Respuesta simulada
 */
export function simulateWhatIfLocal(
  graph: SubjectGraph,
  classification: Map<number, SubjectClassification>,
  simulatedCompletedIds: number[]
): SimulateResponse {
  const currently_in_course: SimEnrolledSubject[] = [];
  const simulated_subjects: SimEnrolledSubject[] = [];
  const newly_unlocked: SimUnlockedSubject[] = [];

  // 1. Materias enrolled (para mostrar checkboxes)
  for (const [id, cls] of classification) {
    // Incluimos materias en curso y regularizadas (que esperan aprobación de final)
    if (cls === 'enrolled' || cls === 'regularizada') {
      const node = graph.nodes.get(id);
      if (node) {
        currently_in_course.push({
          plan_subject_id: id,
          subject_name: node.subject_name,
        });
      }
    }
  }

  // 2. Simular
  const simulatedSet = new Set(simulatedCompletedIds);
  const availableBefore = getAvailableSubjects(graph, classification, new Set());
  const availableAfter = getAvailableSubjects(graph, classification, simulatedSet);

  // IDs disponibles antes
  const beforeIds = new Set(availableBefore.map(s => s.plan_subject_id));

  // 3. Materias simuladas
  for (const id of simulatedCompletedIds) {
    const node = graph.nodes.get(id);
    if (node) {
      simulated_subjects.push({
        plan_subject_id: id,
        subject_name: node.subject_name,
      });
    }
  }

  // 4. Nuevas disponibles (las que NO estaban antes)
  for (const subj of availableAfter) {
    if (!beforeIds.has(subj.plan_subject_id)) {
      newly_unlocked.push({
        plan_subject_id: subj.plan_subject_id,
        subject_id: subj.plan_subject_id,
        subject_name: subj.subject_name,
        suggested_year: subj.suggested_year,
        suggested_term: subj.suggested_term,
        credits: subj.credits,
        weekly_hours: subj.weekly_hours,
        unlocked_by: subj.requires.filter(id => simulatedSet.has(id)),
      });
    }
  }

  // 5. Actualmente disponibles
  const currently_available: SimUnlockedSubject[] = availableAfter.map(s => ({
    plan_subject_id: s.plan_subject_id,
    subject_id: s.plan_subject_id,
    subject_name: s.subject_name,
    suggested_year: s.suggested_year,
    suggested_term: s.suggested_term,
    credits: s.credits,
    weekly_hours: s.weekly_hours,
    unlocked_by: [],
  }));

  return {
    currently_in_course,
    simulated_subjects,
    newly_unlocked,
    currently_available,
  };
}
