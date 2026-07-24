export interface SavedPlanItem {
  id: number;
  plan_subject_id: number;
  target_year: number;
  target_term: number;
  status: string;
  plan_subject?: {
    id: number;
    id_subject: number;
    id_study_plan: number;
    suggested_year: number;
    suggested_term: number;
    weekly_hours: number;
    credits: number;
    is_elective?: boolean;
    subject?: {
      id: number;
      name: string;
      code: string;
      is_unahur: boolean;
      weekly_hours: number;
    };
  };
}

export interface SavedPlan {
  id: number;
  id_student: number;
  name: string;
  weekly_hours: number;
  items: SavedPlanItem[];
}

// ─── Tipos de datos crudos (respuesta del backend) ───

export interface RawPlanSubject {
  id: number;
  id_study_plan: number;
  id_subject: number;
  suggested_year: number;
  suggested_term: number;
  weekly_hours: number;
  credits: number;
  is_elective?: boolean;
  is_final_project?: boolean;
  subject: {
    name: string;
    code: string;
    is_unahur: boolean;
  };
}

export interface RawCorrelativity {
  id: number;
  id_plan_subject_target: number;
  id_required_plan_subject: number;
  type: 'regularidad' | 'aprobacion' | 'finalizada' | null;
}

export interface RawFinalExam {
  id: number;
  status: string;
  grade: number | null;
  year: number | null;
  semester: number | null;
}

export interface RawAcademicRecord {
  id: number;
  plan_subject_id: number;
  status: string;                  // "aprobado" | "pendiente" | "enrolled" | "desaprobado"
  grade: number | string | null;
  regularity_expires_at: string | null;
  year: number;
  semester: number;
  final_exams: RawFinalExam[];
}

export interface PlannerDataResponse {
  planSubjects: RawPlanSubject[];
  correlativities: RawCorrelativity[];
  academicRecords: RawAcademicRecord[];
  enrollment: {
    id: number;
    enrolled_at: string;
    study_plan_id: number;
    study_plan: null;
  };
  currentPeriod: {
    year: number;                  // ej: 2026
    term: number;                  // 1 o 2
  };
}

// ─── Tipos del grafo de correlatividades ───

export interface PrerequisiteInfo {
  required_plan_subject_id: number;
  subject_name: string;
  correlativity_type: 'regularidad' | 'aprobacion' | 'finalizada' | null;
}

export interface SubjectGraphNode {
  plan_subject_id: number;
  subject_name: string;
  weekly_hours: number;
  credits: number;
  suggested_year: number;
  suggested_term: number;
  block_type?: 'unahur' | 'elective'; // si es electiva/UNAHUR, para conservar el color/tag al mover
  is_final_project?: boolean;         // si es el proyecto final: se fuerza a que quede último en el cronograma
  // Aristas del grafo
  required_by: number[];           // IDs de materias que DEPENDEN de esta
  requires: number[];              // IDs de correlativas que esta NECESITA
  requirements: PrerequisiteInfo[]; // Info detallada de cada correlativa
}

export interface SubjectGraph {
  nodes: Map<number, SubjectGraphNode>;
  // Topological ordering computed once
  topoOrder: number[];
  // Unlock weights computed once
  unlockWeights: Map<number, number>;
}

// ─── Clasificación de materias ───

export type SubjectClassification =
  | 'finalizada'
  | 'regularizada'
  | 'enrolled'
  | 'faltante';

// ─── Plan proyectado ───

export type PlannerElementType = 'subject' | 'event' | 'generic_block';

export interface PlannedSubject {
  plan_subject_id: number;
  subject_name: string;
  weekly_hours: number;
  credits: number;
  weight: number;                  // peso de desbloqueo
  anchored?: boolean;             // indica si la materia fue fijada por el usuario
  element_type?: PlannerElementType;
  block_type?: 'unahur' | 'elective'; // si la materia es una electiva/UNAHUR (mismo drag & drop que cualquier otra)
  /** Si está seteado, es una materia YA cursada (viene de un registro académico real,
   *  ubicada en su año/cuatrimestre real) — se muestra sin drag y en gris, distinta de
   *  la proyección a futuro. Ver `completed_subjects` en PlannedSemester. */
  completed_status?: SubjectClassification;
}

export interface GenericBlock {
  element_type: 'generic_block';
  block_type: 'unahur' | 'elective';
  title: string;
  estimated_hours: number;
  credits?: number;
}

export interface PlannedEvent {
  event_type: 'final_exam';
  plan_subject_id: number;
  subject_name: string;
  due_date?: string | null;
  element_type?: PlannerElementType;
  /** Año/cuatrimestre donde se ubica la card — el de regularización, salvo que el
   *  alumno ya haya reprogramado el final (ver final_exam_id). */
  year: number;
  semester: number;
  /** Año/cuatrimestre real en que se cursó y regularizó la materia — piso para el drag,
   *  nunca se puede reprogramar el final antes de este período. */
  regularized_year: number;
  regularized_semester: number;
  /** AcademicRecord al que pertenece este final — se usa para crear/actualizar el FinalExam al mover la card. */
  academic_record_id: number;
  /** FinalExam "pendiente" ya guardado, si el alumno ya reprogramó este final antes. Si no existe, se crea al primer drag. */
  final_exam_id?: number;
}

export interface PlannedSemester {
  term: number;                    // 1 o 2
  subjects: PlannedSubject[];
  total_hours: number;
  events?: PlannedEvent[];
  generic_blocks?: GenericBlock[];
  /** Materias ya cursadas (finalizada/regularizada/enrolled) ubicadas en su período real.
   *  Separado de `subjects` a propósito: el algoritmo de asignación y el motor de
   *  drag & drop (editEngine) solo miran `subjects` — así una materia ya aprobada nunca
   *  puede terminar reubicada por una cascada de correlativas de otra materia. */
  completed_subjects?: PlannedSubject[];
}

export interface PlannedYear {
  year: number;                    // año calendario, ej: 2026
  semesters: PlannedSemester[]; // C1, C2 — always 2 elements at rest, variable during computation
}

export interface Plan {
  years: PlannedYear[];
  total_credits: number;
  limit_hours: number;
}

// ─── Tipos de salida para el guardado ───

export interface SavePlanItem {
  plan_subject_id: number;
  target_year: number;
  target_term: number;
  status: 'planificado' | 'cursando' | 'completado';
}

export interface SavePlanPayload {
  name: string;
  weekly_hours: number;
  items: SavePlanItem[];
}

export interface PrerequisiteStatus {
  required_plan_subject_id: number;
  subject_name: string;
  required_status: string;     // "finalizada" | "regularizada"
  correlativity_type: string;
  current_status: SubjectClassification;
  met: boolean;
}

