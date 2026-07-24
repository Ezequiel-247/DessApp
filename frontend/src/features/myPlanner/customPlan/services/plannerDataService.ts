import { apiClient } from "@/shared/api/apiClient";
import type { PlannerDataResponse } from "../model/planner";

/**
 * Obtiene los datos necesarios para la planificación desde el backend.
 *
 * @param studentId - ID del estudiante
 * @param enrollmentId - Inscripción/carrera elegida en el selector (si el alumno tiene más de una)
 * @returns Datos del planificador (materias, correlativas, registros académicos, período actual)
 * @throws Si el endpoint falla
 */
export async function fetchPlannerData(
  studentId: number | string,
  enrollmentId?: string | number | null
): Promise<PlannerDataResponse> {
  const query = enrollmentId ? `?enrollmentId=${enrollmentId}` : "";
  const res = await apiClient.get(
    `/api/students/${studentId}/planner-data${query}`
  );
  // La respuesta del backend viene envuelta en { data: ... }
  return res.data as PlannerDataResponse;
}
