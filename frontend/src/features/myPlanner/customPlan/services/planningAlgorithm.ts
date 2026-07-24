import type {
  RawPlanSubject,
  RawCorrelativity,
  RawAcademicRecord,
  SubjectGraph,
  SubjectGraphNode,
  PrerequisiteInfo,
  SubjectClassification,
  Plan,
  PlannedSubject,
  PlannedSemester,
  PlannedYear,
  PrerequisiteStatus,
  PlannedEvent,
} from "../model/planner";

/**
 * Construye un grafo de correlatividades a partir de las materias y correlativas.
 * 
 * @param planSubjects - Lista de materias del plan
 * @param correlativities - Lista de correlatividades
 * @returns Grafo de correlatividades con nodos, orden topológico y pesos
 */
export function buildSubjectGraph(
  planSubjects: RawPlanSubject[],
  correlativities: RawCorrelativity[]
): SubjectGraph {
  const nodes = new Map<number, SubjectGraphNode>();

  // 1. Crear nodos a partir de planSubjects
  for (const planSubject of planSubjects) {
    nodes.set(planSubject.id, {
      plan_subject_id: planSubject.id,
      subject_name: planSubject.subject.name,
      weekly_hours: planSubject.weekly_hours,
      credits: planSubject.credits,
      suggested_year: planSubject.suggested_year,
      suggested_term: planSubject.suggested_term,
      block_type: planSubject.is_elective ? 'elective' : planSubject.subject.is_unahur ? 'unahur' : undefined,
      is_final_project: planSubject.is_final_project ?? false,
      required_by: [],
      requires: [],
      requirements: [],
    });
  }

  // 2. Procesar correlatividades
  for (const corr of correlativities) {
    const target = nodes.get(corr.id_plan_subject_target);
    const required = nodes.get(corr.id_required_plan_subject);

    if (!target || !required) continue;

    // Agregar al array requires del target
    target.requires.push(corr.id_required_plan_subject);
    target.requirements.push({
      required_plan_subject_id: corr.id_required_plan_subject,
      subject_name: required.subject_name,
      correlativity_type: corr.type ?? 'aprobacion',
    });

    // Agregar al array required_by del required
    required.required_by.push(corr.id_plan_subject_target);
  }

  // 3. Calcular pesos de desbloqueo
  const unlockWeights = calculateUnlockWeights(nodes);

  // 4. Calcular orden topológico
  const topoOrder = topologicalSort(nodes, unlockWeights);

  return { nodes, topoOrder, unlockWeights };
}

/**
 * Calcula recursivamente cuántos nodos dependen de cada nodo (directa e indirectamente).
 * 
 * @param nodes - Map de nodos del grafo
 * @returns Map de ID de nodo -> peso de desbloqueo
 */
export function calculateUnlockWeights(
  nodes: Map<number, SubjectGraphNode>
): Map<number, number> {
  const memo = new Map<number, number>();
  const visited = new Set<number>();

  function dfs(nodeId: number): number {
    if (memo.has(nodeId)) return memo.get(nodeId)!;
    
    visited.add(nodeId);
    const node = nodes.get(nodeId);
    if (!node) return 0;

    let total = 0;
    for (const dependentId of node.required_by) {
      if (!visited.has(dependentId)) {
        total += 1 + dfs(dependentId);
      }
    }

    visited.delete(nodeId);
    memo.set(nodeId, total);
    return total;
  }

  for (const nodeId of nodes.keys()) {
    dfs(nodeId);
  }

  return memo;
}

/**
 * Realiza un ordenamiento topológico con desempate por peso de desbloqueo.
 * 
 * @param nodes - Map de nodos del grafo
 * @param weights - Map de ID de nodo -> peso de desbloqueo
 * @returns Array de IDs de nodos en orden topológico
 * @throws Si detecta un ciclo en el grafo
 */
export function topologicalSort(
  nodes: Map<number, SubjectGraphNode>,
  weights: Map<number, number>
): number[] {
  const inDegree = new Map<number, number>();
  const result: number[] = [];

  // 1. Calcular in-degree
  for (const node of nodes.values()) {
    if (!inDegree.has(node.plan_subject_id)) {
      inDegree.set(node.plan_subject_id, 0);
    }
    for (const reqId of node.requires) {
      // IMPORTANTE: Solo contar correlativas que también estén en el conjunto de nodos a ordenar
      if (nodes.has(reqId)) {
        inDegree.set(node.plan_subject_id, (inDegree.get(node.plan_subject_id) || 0) + 1);
      }
    }
  }

  // 2. Inicializar cola con nodos de in-degree 0
  const queue: number[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  // 3. Procesar en orden de peso descending (mayor peso primero)
  while (queue.length > 0) {
    // Ordenar por mayor peso
    queue.sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0));
    
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const node = nodes.get(nodeId);
    if (!node) continue;

    // Decrementar in-degree de dependientes
    for (const dependentId of node.required_by) {
      // Solo procesar si el dependiente es parte del sub-grafo actual
      if (!nodes.has(dependentId)) continue;

      const currentDegree = inDegree.get(dependentId) || 0;
      const newDegree = currentDegree - 1;
      inDegree.set(dependentId, newDegree);

      if (newDegree === 0) {
        queue.push(dependentId);
      }
    }
  }

  // 4. Verificar ciclo
  if (result.length !== nodes.size) {
    const sortedIds = new Set(result);
    const problematicNodes = Array.from(nodes.values())
      .filter(n => !sortedIds.has(n.plan_subject_id))
      .map(n => n.subject_name);

    console.error("🚨 [TopologicalSort] Ciclo detectado. Materias involucradas:", problematicNodes);
    throw new Error(`Ciclo detectado en el grafo de correlatividades. Revisá las correlativas de: ${problematicNodes.join(", ")}`);
  }

  return result;
}

/**
 * Clasifica cada materia según su estado académico.
 * 
 * @param records - Registros académicos
 * @param planSubjects - Materias del plan
 * @returns Map de ID de materia -> clasificación
 */
export function classifySubjects(
  records: RawAcademicRecord[],
  planSubjects: RawPlanSubject[]
): Map<number, SubjectClassification> {
  const classification = new Map<number, SubjectClassification>();
  const recordMap = new Map<number, RawAcademicRecord>();

  // Índice de registros por plan_subject_id
  for (const record of records) {
    recordMap.set(record.plan_subject_id, record);
  }

  // Procesar cada materia
  for (const planSubject of planSubjects) {
    const record = recordMap.get(planSubject.id);

    if (!record) {
      // Sin registro → faltante
      classification.set(planSubject.id, 'faltante');
      continue;
    }

    const { status, grade: rawGrade, regularity_expires_at, final_exams } = record;
    // Normalizar nota a número si es posible
    const grade = (rawGrade === null || rawGrade === undefined || rawGrade === '') ? null : rawGrade;
    const numGrade = typeof grade === 'number' ? grade : (grade && !isNaN(Number(grade)) ? Number(grade) : null);
    let cls: SubjectClassification;

    if (status === 'aprobado') {
      if (numGrade !== null && numGrade >= 7) {
        cls = 'finalizada';
      } else if (numGrade !== null && numGrade >= 4 && numGrade <= 6) {
        // Buscar final exam aprobado
        const hasApprovedFinal = final_exams?.some(f => f.status === 'aprobado');
        cls = hasApprovedFinal ? 'finalizada' : 'regularizada';
      } else if (grade === 'C' || grade === 'A' || grade === 'B') {
        // Equivalencia
        cls = 'finalizada';
      } else if (!grade) {
        // Equivalencia sin nota explícita
        cls = 'finalizada';
      } else {
        cls = 'faltante';
      }
    } else if (status === 'pendiente') {
      if (numGrade !== null && numGrade >= 4 && numGrade <= 6) {
        // Buscar final exam aprobado
        const hasApprovedFinal = final_exams?.some(f => f.status === 'aprobado');
        
        if (hasApprovedFinal) {
          cls = 'finalizada';
        } else {
          // Verificar regularidad vigente
          if (regularity_expires_at) {
            const expiryDate = new Date(regularity_expires_at);
            const today = new Date();
            cls = expiryDate >= today ? 'regularizada' : 'faltante';
          } else {
            // Si tiene nota 4-6 pero no fecha de vencimiento, la consideramos regularizada
            cls = 'regularizada';
          }
        }
      } else if (!grade || isNaN(Number(grade))) {
        // Si es pendiente y no tiene nota, la tratamos como "En curso"
        cls = 'enrolled';
      } else {
        cls = 'faltante';
      }
    } else if (status === 'enrolled') {
      cls = 'enrolled';
    } else if (status === 'desaprobado') {
      cls = 'faltante';
    } else {
      cls = 'faltante';
    }

    classification.set(planSubject.id, cls);
  }

  return classification;
}

/**
 * Calcula los eventos de "final pendiente" (materias regularizadas sin final aprobado)
 * a partir de los registros académicos. Es un dato derivado de `records`/`classification`,
 * no de la ubicación de las materias en el plan — por eso se extrajo de `generatePlan()`:
 * también hay que recalcularlo al recargar un plan guardado (`loadFromSaved` en
 * `usePlanner.ts`), donde no hay una regeneración completa del plan.
 */
export function computePendingFinalEvents(
  planSubjects: RawPlanSubject[],
  records: RawAcademicRecord[],
  classification: Map<number, SubjectClassification>
): PlannedEvent[] {
  const planSubjectNameById = new Map<number, string>(
    planSubjects.map(subject => [subject.id, subject.subject.name])
  );

  const events: PlannedEvent[] = [];

  for (const record of records) {
    const currentStatus = classification.get(record.plan_subject_id);
    const hasApprovedFinal = record.final_exams?.some(finalExam => finalExam.status === 'aprobado');

    if (currentStatus !== 'regularizada' || hasApprovedFinal) continue;

    const subjectName = planSubjectNameById.get(record.plan_subject_id) ?? 'Materia';
    // Si el alumno ya reprogramó este final antes, hay un FinalExam "pendiente" guardado
    // con el año/cuatrimestre elegido — se usa ese en vez del de regularización.
    // OJO: solo "pendiente" cuenta como reprogramación; un intento reprobado real
    // (status "desaprobado") es historial, no un placeholder de reprogramación.
    const pendingOverride = record.final_exams?.find(
      fe => fe.status === 'pendiente' && fe.year != null && fe.semester != null
    );
    events.push({
      event_type: 'final_exam',
      plan_subject_id: record.plan_subject_id,
      subject_name: subjectName,
      due_date: record.regularity_expires_at,
      element_type: 'event',
      year: pendingOverride?.year ?? record.year,
      semester: pendingOverride?.semester ?? record.semester,
      regularized_year: record.year,
      regularized_semester: record.semester,
      academic_record_id: record.id,
      final_exam_id: pendingOverride?.id,
    });
  }

  return events;
}

export interface CompletedSubjectPlacement {
  year: number;
  semester: number;
  subject: PlannedSubject;
}

/**
 * Ubica cada materia ya cursada (finalizada/regularizada/enrolled) en su año/cuatrimestre
 * real, según el registro académico. Es un dato derivado de `records`/`classification`,
 * igual que `computePendingFinalEvents` — por eso se extrajo de `generatePlan()`: también
 * hay que recalcularlo al recargar un plan guardado (`loadFromSaved` en `usePlanner.ts`).
 *
 * Devuelve ubicaciones sueltas (no las inserta en un Plan) para que cada llamador las
 * agregue a `semester.completed_subjects` — a propósito NUNCA a `semester.subjects`,
 * para que el algoritmo de asignación y el motor de drag & drop no las toquen.
 */
export function computeCompletedSubjectPlacements(
  planSubjects: RawPlanSubject[],
  records: RawAcademicRecord[],
  classification: Map<number, SubjectClassification>
): CompletedSubjectPlacement[] {
  const recordByPlanSubject = new Map<number, RawAcademicRecord>();
  for (const record of records) {
    recordByPlanSubject.set(record.plan_subject_id, record);
  }

  const placements: CompletedSubjectPlacement[] = [];

  for (const planSubject of planSubjects) {
    const status = classification.get(planSubject.id);
    if (!status || status === 'faltante') continue;

    const record = recordByPlanSubject.get(planSubject.id);
    if (!record) continue;

    placements.push({
      year: record.year,
      semester: record.semester,
      subject: {
        plan_subject_id: planSubject.id,
        subject_name: planSubject.subject.name,
        weekly_hours: planSubject.weekly_hours,
        credits: planSubject.credits,
        weight: 0,
        element_type: 'subject',
        block_type: planSubject.is_elective ? 'elective' : planSubject.subject.is_unahur ? 'unahur' : undefined,
        completed_status: status,
      },
    });
  }

  return placements;
}

/**
 * Encuentra el mejor cuatrimestre para asignar una materia.
 * 
 * @param subjectHours - Horas semanales de la materia
 * @param plan - Plan actual
 * @param startYear - Año para comenzar la búsqueda
 * @param startTerm - Cuatrimestre para comenzar (1 o 2)
 * @param limitHours - Límite de horas semanales por cuatrimestre
 * @returns Año y término donde se asignó la materia
 * @throws Si subjectHours > limitHours
 */
export function findBestTerm(
  subjectHours: number,
  plan: Plan,
  startYear: number,
  startTerm: number,
  limitHours: number
): { year: number; term: number } {
  if (subjectHours > limitHours) {
    throw new Error(
      `La materia requiere ${subjectHours}hs semanales, que supera tu límite de ${limitHours}hs.`
    );
  }

  let currentYear = startYear;
  let currentTerm = startTerm;

  while (true) {
    // Asegurar que el año existe
    let yearPlan = plan.years.find(y => y.year === currentYear);
    if (!yearPlan) {
      yearPlan = {
        year: currentYear,
        semesters: [
          { term: 1, subjects: [], total_hours: 0 },
          { term: 2, subjects: [], total_hours: 0 },
        ],
      };
      plan.years.push(yearPlan);
    }

    const semesterIndex = currentTerm === 1 ? 0 : 1;
    const semester = yearPlan.semesters[semesterIndex];

    if (semester.total_hours + getGenericBlockHours(semester) + subjectHours <= limitHours) {
      return { year: currentYear, term: currentTerm };
    }

    // Avanzar al siguiente período
    if (currentTerm === 1) {
      currentTerm = 2;
    } else {
      currentTerm = 1;
      currentYear += 1;
    }
  }
}

/**
 * Suma las horas estimadas de los bloques genéricos (UNAHUR/electivas) de un cuatrimestre.
 * Estas horas no forman parte de `semester.total_hours` (que solo cuenta `subjects`),
 * por lo que hay que sumarlas aparte en cualquier chequeo de límite horario.
 */
export function getGenericBlockHours(semester: PlannedSemester): number {
  return (semester.generic_blocks ?? []).reduce(
    (sum, block) => sum + (block.estimated_hours || 0),
    0
  );
}

/**
 * Calcula las horas totales en un cuatrimestre específico.
 * Incluye tanto las materias (`total_hours`) como los bloques genéricos
 * (UNAHUR/electivas), que se cuentan aparte.
 *
 * @param plan - Plan actual
 * @param year - Año
 * @param term - Cuatrimestre (1 o 2)
 * @returns Total de horas semanales
 */
export function calculateTermHours(
  plan: Plan,
  year: number,
  term: number
): number {
  const yearPlan = plan.years.find(y => y.year === year);
  if (!yearPlan) return 0;

  const semesterIndex = term === 1 ? 0 : 1;
  const semester = yearPlan.semesters[semesterIndex];
  if (!semester) return 0;

  return (semester.total_hours ?? 0) + getGenericBlockHours(semester);
}

/**
 * Obtiene el estado de cumplimiento de los requisitos de una materia.
 * 
 * @param graph - Grafo de correlatividades
 * @param plan - Plan actual
 * @param planSubjectId - ID de la materia a verificar
 * @param classification - Clasificación actual de materias
 * @returns Array de estados de requisitos
 */
export function getPrerequisiteStatus(
  graph: SubjectGraph,
  plan: Plan,
  planSubjectId: number,
  classification: Map<number, SubjectClassification>
): PrerequisiteStatus[] {
  const node = graph.nodes.get(planSubjectId);
  if (!node) return [];

  const statuses: PrerequisiteStatus[] = [];

  for (const prereqInfo of node.requirements) {
    const prereqId = prereqInfo.required_plan_subject_id;
    const currentStatus = classification.get(prereqId) ?? 'faltante';
    
    const correlativityType = prereqInfo.correlativity_type ?? 'aprobacion';
    let required_status: string;
    let met: boolean;

    if (correlativityType === 'regularidad') {
      required_status = 'finalizada o regularizada';
      met = currentStatus === 'finalizada' || currentStatus === 'regularizada';
    } else if (correlativityType === 'aprobacion' || correlativityType === null) {
      required_status = 'finalizada';
      met = currentStatus === 'finalizada';
    } else if (correlativityType === 'finalizada') {
      required_status = 'finalizada';
      met = currentStatus === 'finalizada';
    } else {
      required_status = 'finalizada';
      met = false;
    }

    // Si la correlativa está en el plan (asignada a futuro), NO está cumplida
    const prereqInPlan = plan.years.some(year =>
      year.semesters.some(sem =>
        sem.subjects.some(s => s.plan_subject_id === prereqId)
      )
    );
    if (prereqInPlan) {
      met = false;
    }

    statuses.push({
      required_plan_subject_id: prereqId,
      subject_name: prereqInfo.subject_name,
      required_status,
      correlativity_type: correlativityType,
      current_status: currentStatus,
      met,
    });
  }

  return statuses;
}

/**
 * Obtiene las materias disponibles para cursar según su estado y correlativas.
 * 
 * @param graph - Grafo de correlatividades
 * @param classification - Clasificación de materias (mutable: será clonado internamente)
 * @param simulatedFinalizadas - IDs de materias a simular como finalizadas
 * @returns Array de nodos de materias disponibles
 */
export function getAvailableSubjects(
  graph: SubjectGraph,
  classification: Map<number, SubjectClassification>,
  simulatedFinalizadas: Set<number>
): SubjectGraphNode[] {
  // Clonar clasificación para no mutar el original
  const classificationCopy = new Map(classification);

  // Marcar simuladas como finalizadas
  for (const id of simulatedFinalizadas) {
    classificationCopy.set(id, 'finalizada');
  }

  const available: SubjectGraphNode[] = [];

  for (const node of graph.nodes.values()) {
    const currentStatus = classificationCopy.get(node.plan_subject_id) ?? 'faltante';

    // No incluir ya finalizadas o regularizadas
    if (currentStatus === 'finalizada' || currentStatus === 'regularizada') {
      continue;
    }

    // Verificar si todos los requisitos están cumplidos
    const prereqStatuses = getPrerequisiteStatus(
      graph,
      { years: [], total_credits: 0, limit_hours: 0 },
      node.plan_subject_id,
      classificationCopy
    );

    const allMetRequirements = prereqStatuses.every(p => p.met);

    if (allMetRequirements) {
      available.push(node);
    }
  }

  return available;
}

/**
 * Genera el plan completo a partir de los datos del estudiante.
 * Esta es la función orquestadora principal del algoritmo.
 * 
 * @param planSubjects - Materias del plan
 * @param records - Registros académicos
 * @param correlativities - Correlatividades
 * @param limitHours - Límite de horas semanales por cuatrimestre
 * @param startYear - (Opcional) Año para re-optimización parcial
 * @param startTerm - (Opcional) Cuatrimestre para re-optimización parcial
 * @param electivePoolIds - (Opcional) IDs de plan_subject que pertenecen a algún bloque
 *   electivo (ej. PlanElectiveBlock). Estas materias solo se proyectan si además están
 *   en `chosenElectiveIds` — evita mostrar TODAS las opciones del bloque a la vez.
 * @param chosenElectiveIds - (Opcional) Subconjunto de `electivePoolIds` que el estudiante
 *   efectivamente eligió para este plan.
 * @param unahurPoolIds - (Opcional) IDs de plan_subject cuya materia es UNAHUR
 *   (`subject.is_unahur`). Mismo mecanismo que `electivePoolIds`: solo se proyectan si
 *   además están en `chosenUnahurIds`.
 * @param chosenUnahurIds - (Opcional) Subconjunto de `unahurPoolIds` que el estudiante
 *   efectivamente eligió para este plan.
 * @returns Plan generado
 */
export function generatePlan(
  planSubjects: RawPlanSubject[],
  records: RawAcademicRecord[],
  correlativities: RawCorrelativity[],
  limitHours: number,
  startYear?: number,
  startTerm?: number,
  electivePoolIds?: Set<number>,
  chosenElectiveIds?: Set<number>,
  unahurPoolIds?: Set<number>,
  chosenUnahurIds?: Set<number>
): Plan {
  // FASE 1: PREPARACIÓN
  const graph = buildSubjectGraph(planSubjects, correlativities);
  const classification = classifySubjects(records, planSubjects);

  // Filtrar solo las materias que realmente deben proyectarse.
  // Las materias finalizadas, regularizadas y en curso no deben entrar en la proyección automática.
  // Las electivas/UNAHUR SÍ se proyectan como cualquier otra materia (con drag & drop y
  // cascada de correlativas reales) — solo se diferencian visualmente vía `block_type`.
  // Las que pertenecen a un bloque electivo (elegí N de M) solo se proyectan si el
  // estudiante ya las eligió — si no, se muestran TODAS las opciones del bloque, que
  // es justo lo que se quería evitar.
  const pendingSubjectIds = Array.from(classification.entries())
    .filter(([id, cls]) => {
      if (cls === 'finalizada' || cls === 'regularizada' || cls === 'enrolled') return false;
      if (electivePoolIds?.has(id) && !chosenElectiveIds?.has(id)) return false;
      if (unahurPoolIds?.has(id) && !chosenUnahurIds?.has(id)) return false;
      return true;
    })
    .map(([id]) => id);

  // Determinar período inicial
  const currentYear = startYear ?? new Date().getFullYear();
  const currentTerm = startTerm ?? 1;

  const plan: Plan = {
    years: [],
    total_credits: 0,
    limit_hours: limitHours,
  };

  const ensureSemester = (year: number, term: number): PlannedSemester => {
    let yearPlan = plan.years.find(item => item.year === year);
    if (!yearPlan) {
      yearPlan = {
        year,
        semesters: [
          { term: 1, subjects: [], total_hours: 0, events: [], generic_blocks: [] },
          { term: 2, subjects: [], total_hours: 0, events: [], generic_blocks: [] },
        ],
      };
      plan.years.push(yearPlan);
    }

    const semesterIndex = term === 1 ? 0 : 1;
    const semester = yearPlan.semesters[semesterIndex];
    if (!semester.events) {
      semester.events = [];
    }
    if (!semester.generic_blocks) {
      semester.generic_blocks = [];
    }
    return semester;
  };

  const pendingFinalEvents = computePendingFinalEvents(planSubjects, records, classification);
  for (const event of pendingFinalEvents) {
    const semester = ensureSemester(event.year, event.semester);
    if (!semester.events?.some(existing => existing.plan_subject_id === event.plan_subject_id)) {
      semester.events?.push(event);
    }
  }

  const completedPlacements = computeCompletedSubjectPlacements(planSubjects, records, classification);
  for (const placement of completedPlacements) {
    const semester = ensureSemester(placement.year, placement.semester);
    if (!semester.completed_subjects) semester.completed_subjects = [];
    semester.completed_subjects.push(placement.subject);
  }

  // FASE 2: ORDENAMIENTO
  // Construir grafo solo para materias pendientes
  const pendingNodeMap = new Map<number, SubjectGraphNode>();
  for (const id of pendingSubjectIds) {
    const node = graph.nodes.get(id);
    if (node) {
      pendingNodeMap.set(id, node);
    }
  }

  const pendingWeights = calculateUnlockWeights(pendingNodeMap);
  const topoOrder = topologicalSort(pendingNodeMap, pendingWeights);

  // FASE 3: ASIGNACIÓN GREEDY
  // El proyecto final (is_final_project) se procesa en una segunda pasada, al final,
  // para que nunca quede "en el medio" del cronograma — ni siquiera antes de una
  // electiva que se ubicó tarde por falta de espacio en cuatrimestres tempranos.
  const regularOrder = topoOrder.filter(id => !graph.nodes.get(id)?.is_final_project);
  const finalProjectOrder = topoOrder.filter(id => graph.nodes.get(id)?.is_final_project);

  function assignSubject(subjectId: number, minStartPeriod?: { year: number; term: number }): void {
    const subject = graph.nodes.get(subjectId);
    if (!subject) return;

    // Determinar punto de partida
    let startPeriod: { year: number; term: number };

    if (subject.requires.length === 0) {
      // Sin requisitos → comienza desde el período actual
      startPeriod = { year: currentYear, term: currentTerm };
    } else {
      // Buscar el período más lejano de los requisitos
      const latestPrereqPeriod = findLatestPrerequisitePeriod(
        subject,
        plan,
        classification
      );

      if (latestPrereqPeriod) {
        // El siguiente período después del último requisito
        startPeriod = advancePeriodForAssignment(
          latestPrereqPeriod.year,
          latestPrereqPeriod.term
        );
      } else {
        startPeriod = { year: currentYear, term: currentTerm };
      }
    }

    if (
      minStartPeriod &&
      (minStartPeriod.year > startPeriod.year ||
        (minStartPeriod.year === startPeriod.year && minStartPeriod.term > startPeriod.term))
    ) {
      startPeriod = minStartPeriod;
    }

    // Encontrar mejor cuatrimestre
    const target = findBestTerm(
      subject.weekly_hours,
      plan,
      startPeriod.year,
      startPeriod.term,
      limitHours
    );

    // Asignar materia
    const yearPlan = plan.years.find(y => y.year === target.year)!;
    const semesterIndex = target.term === 1 ? 0 : 1;
    const semester = yearPlan.semesters[semesterIndex];

    const plannedSubject: PlannedSubject = {
      plan_subject_id: subject.plan_subject_id,
      subject_name: subject.subject_name,
      weekly_hours: subject.weekly_hours,
      credits: subject.credits,
      weight: pendingWeights.get(subject.plan_subject_id) ?? 0,
      // Las materias generadas por el algoritmo no están ancladas por defecto.
      // La propiedad 'anchored' se usa para que el motor de edición no mueva materias fijadas por el usuario.
      anchored: false,
      element_type: 'subject',
      block_type: subject.block_type,
    };

    semester.subjects.push(plannedSubject);
    semester.total_hours += subject.weekly_hours;
    plan.total_credits += subject.credits;
  }

  for (const subjectId of regularOrder) {
    assignSubject(subjectId);
  }

  for (const subjectId of finalProjectOrder) {
    const lastOccupied = findLastOccupiedPeriod(plan);
    const minStartPeriod = lastOccupied
      ? advancePeriodForAssignment(lastOccupied.year, lastOccupied.term)
      : undefined;
    assignSubject(subjectId, minStartPeriod);
  }

  return plan;
}

/**
 * Encuentra el último período (año/cuatrimestre) donde hay alguna materia asignada
 * en todo el plan. Se usa para forzar que el proyecto final quede siempre después
 * de absolutamente todo lo demás, incluidas las electivas.
 */
function findLastOccupiedPeriod(plan: Plan): { year: number; term: number } | null {
  let latest: { year: number; term: number } | null = null;

  for (const yearPlan of plan.years) {
    for (const semester of yearPlan.semesters) {
      if (semester.subjects.length === 0) continue;
      if (
        !latest ||
        yearPlan.year > latest.year ||
        (yearPlan.year === latest.year && semester.term > latest.term)
      ) {
        latest = { year: yearPlan.year, term: semester.term };
      }
    }
  }

  return latest;
}

/**
 * Encuentra el período más lejano donde están asignados los requisitos.
 * 
 * @param subject - Nodo de la materia
 * @param plan - Plan actual
 * @param classification - Clasificación de materias
 * @returns Período más lejano de los requisitos en el plan, o null si ninguno está en el plan
 */
function findLatestPrerequisitePeriod(
  subject: SubjectGraphNode,
  plan: Plan,
  classification: Map<number, SubjectClassification>
): { year: number; term: number } | null {
  let latestYear = 0;
  let latestTerm = 0;
  let found = false;

  for (const prereqId of subject.requires) {
    const prereqStatus = classification.get(prereqId);
    
    // Solo contar si está en el plan (no finalizadas previas)
    const period = findSubjectPeriodInPlan(plan, prereqId);
    if (period) {
      found = true;
      const isLater =
        period.year > latestYear ||
        (period.year === latestYear && period.term > latestTerm);
      
      if (isLater) {
        latestYear = period.year;
        latestTerm = period.term;
      }
    }
  }

  return found ? { year: latestYear, term: latestTerm } : null;
}

/**
 * Encuentra el período donde está asignada una materia en el plan.
 * 
 * @param plan - Plan actual
 * @param subjectId - ID de la materia
 * @returns Período o null si no está asignada
 */
function findSubjectPeriodInPlan(
  plan: Plan,
  subjectId: number
): { year: number; term: number } | null {
  for (const yearPlan of plan.years) {
    for (const semester of yearPlan.semesters) {
      if (semester.subjects.some(s => s.plan_subject_id === subjectId)) {
        return { year: yearPlan.year, term: semester.term };
      }
    }
  }
  return null;
}

/**
 * Avanza un período cronológicamente.
 * 
 * @param year - Año actual
 * @param term - Cuatrimestre actual (1 o 2)
 * @returns Siguiente período
 */
export function advancePeriodForAssignment(
  year: number,
  term: number
): { year: number; term: number } {
  if (term === 1) {
    return { year, term: 2 };
  } else {
    return { year: year + 1, term: 1 };
  }
}

/**
 * Busca el último período disponible hacia atrás para asignar una materia.
 * Itera desde `startYear/startTerm` hacia atrás hasta encontrar un período con espacio.
 * Útil para CASO 5 (reverse cascade): reubicar correlativas en períodos anteriores.
 * 
 * @param subjectHours - Horas semanales de la materia
 * @param plan - Plan actual
 * @param startYear - Año para comenzar la búsqueda (hacia atrás)
 * @param startTerm - Cuatrimestre para comenzar (1 o 2)
 * @param limitHours - Límite de horas semanales
 * @returns Año y término encontrados
 * @throws Si subjectHours > limitHours o no hay espacio en ningún período anterior
 */
export function findBestTermBackwards(
  subjectHours: number,
  plan: Plan,
  startYear: number,
  startTerm: number,
  limitHours: number,
  minYear?: number,
  graph?: SubjectGraph,
  subjectId?: number
): { year: number; term: number } {
  if (subjectHours > limitHours) {
    throw new Error(
      `La materia requiere ${subjectHours}hs semanales, que supera tu límite de ${limitHours}hs.`
    );
  }

  let currentYear = startYear;
  let currentTerm = startTerm;

  // Año mínimo: no ir más atrás que el año actual del estudiante
  const lowerBound = minYear ?? new Date().getFullYear();
  console.log('    🔍 [BEST_TERM_BACK] start:', startYear, startTerm, 'lowerBound:', lowerBound, 'subjectHours:', subjectHours);

  while (currentYear >= lowerBound) {
    console.log('    🔍 [BEST_TERM_BACK] checking year:', currentYear, 'term:', currentTerm, 'lowerBound:', lowerBound);
    let yearPlan = plan.years.find(y => y.year === currentYear);
    if (!yearPlan) {
      console.log('    🔍 [BEST_TERM_BACK] CREANDO año:', currentYear);
      yearPlan = {
        year: currentYear,
        semesters: [
          { term: 1, subjects: [], total_hours: 0 },
          { term: 2, subjects: [], total_hours: 0 },
        ],
      };
      plan.years.push(yearPlan);
    }

    const semesterIndex = currentTerm === 1 ? 0 : 1;
    const semester = yearPlan.semesters[semesterIndex];
    const occupiedHours = semester.total_hours + getGenericBlockHours(semester);
    const hasCapacity = occupiedHours + subjectHours <= limitHours;
    console.log('    🔍 [BEST_TERM_BACK] semester hours:', occupiedHours, '+', subjectHours, '<=', limitHours, '?', hasCapacity);

    let prereqsOk = true;
    if (graph && subjectId != null) {
      const node = graph.nodes.get(subjectId);
      if (node) {
        for (const prereqId of node.requires) {
          const prereqPeriod = findSubjectPeriodInPlan(plan, prereqId);
          if (prereqPeriod) {
            const prereqBeforeCandidate =
              prereqPeriod.year < currentYear ||
              (prereqPeriod.year === currentYear && prereqPeriod.term < currentTerm);
            if (!prereqBeforeCandidate) {
              prereqsOk = false;
              console.log('    🔍 [BEST_TERM_BACK] candidate invalid for subject', subjectId, 'because prereq', prereqId, 'is in', prereqPeriod);
              break;
            }
          }
        }
      }
    }

    if (hasCapacity && prereqsOk) {
      console.log('    🔍 [BEST_TERM_BACK] encontrado!:', currentYear, currentTerm);
      return { year: currentYear, term: currentTerm };
    }

    // Go back one period
    if (currentTerm === 1) {
      currentTerm = 2;
      currentYear -= 1;
    } else {
      currentTerm = 1;
    }
  }

  console.log('    🔍 [BEST_TERM_BACK] no encontró espacio, lowerBound:', lowerBound, 'currentYear:', currentYear);
  throw new Error(
    `No hay espacio disponible en períodos anteriores para esta materia. ` +
    `Intentá reducir la carga horaria de los cuatrimestres previos.`
  );
}
