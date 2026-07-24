import type {
  Plan,
  PlannedSubject,
  SubjectGraph,
  SubjectGraphNode,
} from "../model/planner";
import {
  findBestTerm,
  findBestTermBackwards,
  calculateTermHours,
  advancePeriodForAssignment,
} from "./planningAlgorithm";

/**
 * Procesa el movimiento de una materia aplicando todas las validaciones
 * y efectos cascada:
 * - Caso 3: dependientes que quedan en el pasado/presente se reubican hacia adelante.
 * - Caso 5: correlativas que quedan en el futuro se reubican hacia atrás (o se aborta
 *   si no hay cadena de cuatrimestres disponible antes de `minYear`).
 * - Sobrecupo de horas: se expulsan materias de menor peso de desbloqueo hasta entrar en el límite.
 *
 * El caso "sándwich" (una materia con un prerequisito Y un dependiente en conflicto
 * simultáneo) no tiene una rama de código separada: se resuelve con la combinación de
 * Caso 3 + Caso 5 + el reintento con períodos candidatos de más abajo. Ver los tests
 * "processMove — caso sándwich" en editEngine.test.ts para la verificación empírica.
 *
 * @param plan - Plan actual (será clonado, no se muta)
 * @param subjectId - ID de la materia a mover
 * @param targetPeriod - Período destino
 * @param planSubjects - Materias del plan (datos crudos del backend)
 * @param records - Registros académicos
 * @param correlativities - Correlatividades
 * @param graph - Grafo de correlatividades
 * @param classification - Clasificación de materias
 * @param limitHours - Límite de horas semanales
 * @returns Plan modificado con la materia movida y cascadas aplicadas
 * @throws Si ningún período candidato resulta viable (correlativas sin margen, o sin espacio horario)
 */
export function processMove(
  plan: Plan,
  subjectId: number,
  targetPeriod: { year: number; term: number },
  graph: SubjectGraph,
  limitHours: number,
  minYear?: number
): Plan {
  const yearFloor = minYear ?? new Date().getFullYear();
  const candidatePeriods = buildCandidatePeriods(targetPeriod, yearFloor);
  const originalPlan = structuredClone(plan);
  let lastError: Error | null = null;

  for (const candidatePeriod of candidatePeriods) {
    try {
      return applyMoveToPlan(
        originalPlan,
        subjectId,
        candidatePeriod,
        graph,
        limitHours,
        yearFloor
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(describeExhaustedCandidates(candidatePeriods, lastError));
}

/**
 * Arma un mensaje claro cuando se agotan los períodos candidatos (destino pedido +
 * hasta 6 cuatrimestres hacia adelante y hacia atrás). Sin esto, el error visible
 * sería el de la ÚLTIMA búsqueda intentada (típicamente la más lejana hacia atrás),
 * que puede no tener nada que ver con el período que el usuario efectivamente pidió.
 */
function describeExhaustedCandidates(
  candidatePeriods: Array<{ year: number; term: number }>,
  lastError: Error | null
): string {
  if (candidatePeriods.length === 0) {
    return lastError?.message ?? "No se pudo encontrar un cuatrimestre compatible para la materia.";
  }

  let earliest = candidatePeriods[0];
  let latest = candidatePeriods[0];
  for (const period of candidatePeriods) {
    if (period.year < earliest.year || (period.year === earliest.year && period.term < earliest.term)) {
      earliest = period;
    }
    if (period.year > latest.year || (period.year === latest.year && period.term > latest.term)) {
      latest = period;
    }
  }

  const range = `${earliest.year}-C${earliest.term} y ${latest.year}-C${latest.term}`;
  const reason = lastError ? ` Último motivo probado: ${lastError.message}` : "";
  return `No se encontró un cuatrimestre compatible para esta materia entre ${range} (${candidatePeriods.length} opciones probadas).${reason}`;
}

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

  const originalPlan = structuredClone(plan);
  const newPlan = processMove(plan, subjectId, targetPeriod, graph, limitHours, minYear);

  const adjustedSubjects: string[] = [];
  const warnings: string[] = [];

  for (const year of originalPlan.years) {
    for (const semester of year.semesters) {
      for (const subjectItem of semester.subjects) {
        if (subjectItem.plan_subject_id === subjectId) continue;

        const originalLocation = { year: year.year, term: semester.term };
        const newLocation = findSubjectInPlan(newPlan, subjectItem.plan_subject_id);

        if (newLocation && (newLocation.year !== originalLocation.year || newLocation.term !== originalLocation.term)) {
          const node = graph.nodes.get(subjectItem.plan_subject_id);
          if (node) {
            adjustedSubjects.push(node.subject_name);
          }
        }
      }
    }
  }

  for (const year of newPlan.years) {
    for (const semester of year.semesters) {
      if (semester.total_hours > limitHours) {
        warnings.push(
          `${year.year}-C${semester.term} supera el límite de ${limitHours}hs (${semester.total_hours}hs).`
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

/**
 * Agrega una materia electiva/UNAHUR recién elegida por el estudiante al plan,
 * respetando sus propias correlativas (si requiere algo que ya está en el plan,
 * arranca en el cuatrimestre siguiente a eso). A diferencia de processMove, no
 * dispara ninguna cascada: las electivas no tienen dependientes (nada las requiere),
 * así que no hay nada que reacomodar.
 */
export function addElectiveSubject(
  plan: Plan,
  graph: SubjectGraph,
  subjectId: number,
  limitHours: number,
  minYear?: number
): Plan {
  const newPlan = structuredClone(plan);
  const node = graph.nodes.get(subjectId);
  if (!node) {
    throw new Error("Materia no encontrada en el grafo");
  }

  if (findSubjectInPlan(newPlan, subjectId)) {
    return newPlan;
  }

  const yearFloor = minYear ?? new Date().getFullYear();
  let startPeriod = { year: yearFloor, term: 1 };
  const latestPrereqPeriod = findLatestPrerequisitePeriodInPlan(node, newPlan);
  if (latestPrereqPeriod) {
    startPeriod = advancePeriodForAssignment(latestPrereqPeriod.year, latestPrereqPeriod.term);
  }

  const target = findBestTerm(node.weekly_hours, newPlan, startPeriod.year, startPeriod.term, limitHours);

  addSubjectToPlan(newPlan, {
    plan_subject_id: node.plan_subject_id,
    subject_name: node.subject_name,
    weekly_hours: node.weekly_hours,
    credits: node.credits,
    weight: graph.unlockWeights.get(node.plan_subject_id) ?? 0,
    block_type: node.block_type,
  }, target.year, target.term);

  return newPlan;
}

/**
 * Quita una electiva/UNAHUR del plan (deshacer una elección). Como no tienen
 * dependientes, no hace falta ninguna cascada.
 */
export function removeElectiveSubject(plan: Plan, subjectId: number): Plan {
  const newPlan = structuredClone(plan);
  removeSubjectFromPlan(newPlan, subjectId);
  return newPlan;
}

function applyMoveToPlan(
  plan: Plan,
  subjectId: number,
  targetPeriod: { year: number; term: number },
  graph: SubjectGraph,
  limitHours: number,
  minYear?: number
): Plan {
  const newPlan = structuredClone(plan);

  for (const year of newPlan.years) {
    for (const semester of year.semesters) {
      let newTotalHours = 0;
      for (const subject of semester.subjects) {
        const graphNode = graph.nodes.get(subject.plan_subject_id);
        if (graphNode && typeof graphNode.weekly_hours === 'number') {
          subject.weekly_hours = graphNode.weekly_hours;
        }
        newTotalHours += (subject.weekly_hours || 0);
      }
      semester.total_hours = newTotalHours;
    }
  }

  const sourceLocation = removeSubjectFromPlan(newPlan, subjectId);
  if (!sourceLocation) {
    throw new Error("Materia no encontrada en el plan");
  }

  const subject = graph.nodes.get(subjectId);
  if (!subject) {
    throw new Error("Materia no encontrada en el grafo");
  }

  const plannedSubject: PlannedSubject = {
    plan_subject_id: subject.plan_subject_id,
    subject_name: subject.subject_name,
    weekly_hours: subject.weekly_hours,
    credits: subject.credits,
    weight: graph.unlockWeights.get(subjectId) ?? 0,
    block_type: subject.block_type,
  };

  addSubjectToPlan(newPlan, plannedSubject, targetPeriod.year, targetPeriod.term);

  if (!hasPrerequisitesInPast(newPlan, graph, subjectId, targetPeriod)) {
    const yearFloor = minYear ?? new Date().getFullYear();
    const chainValidation = validatePrereqChainMovable(
      subject,
      targetPeriod,
      graph,
      yearFloor
    );

    if (!chainValidation.valid) {
      throw new Error(chainValidation.warning ?? "La cadena de correlativas no puede reacomodarse en este período.");
    }

    const cursor = goBackOnePeriod(targetPeriod.year, targetPeriod.term);

    if (cursor.year < yearFloor) {
      throw new Error(
        "Movimiento inválido: Esta materia requiere cursadas previas que no pueden reacomodarse."
      );
    }

    const reverseMoved = new Set<number>([subjectId]);

    try {
      resolvePrerequisiteRecursive(
        newPlan, subjectId, cursor, graph, limitHours, reverseMoved, minYear
      );
    } catch (e: any) {
      throw new Error(`No se pudo reacomodar la cadena de correlativas: ${e.message}`);
    }

    if (!hasPrerequisitesInPast(newPlan, graph, subjectId, targetPeriod)) {
      throw new Error(
        "Movimiento inválido: Esta materia requiere cursadas previas que no pueden reacomodarse."
      );
    }
  }

  const overflowBag: number[] = [];
  const affected = findDependentSubjectsInPastOrPresent(
    newPlan,
    graph,
    subjectId,
    targetPeriod
  );

  for (const depsId of affected) {
    const removed = removeSubjectFromPlan(newPlan, depsId);
    if (removed) {
      overflowBag.push(depsId);
    }
  }

  let { year: evalYear, term: evalTerm } = targetPeriod;
  while (calculateTermHours(newPlan, evalYear, evalTerm) > limitHours) {
    const candidates = getSubjectsInPeriod(newPlan, evalYear, evalTerm)
      .filter(s => s.plan_subject_id !== subjectId);

    if (candidates.length === 0) {
      throw new Error(
        "No hay espacio disponible. La materia movida es la única en este cuatrimestre " +
        "y supera el límite de horas."
      );
    }

    candidates.sort((a, b) => {
      const weightDiff = a.weight - b.weight;
      if (weightDiff !== 0) return weightDiff;

      const aPeriod = findSubjectInPlan(newPlan, a.plan_subject_id);
      const bPeriod = findSubjectInPlan(newPlan, b.plan_subject_id);

      if (aPeriod && bPeriod) {
        if (aPeriod.year !== bPeriod.year) {
          return bPeriod.year - aPeriod.year;
        }
        return bPeriod.term - aPeriod.term;
      }

      return 0;
    });

    const toMove = candidates[0];

    const removed = removeSubjectFromPlan(newPlan, toMove.plan_subject_id);
    if (removed) {
      overflowBag.push(toMove.plan_subject_id);
    }
  }

  if (overflowBag.length > 0) {
    const topoOrder = graph.topoOrder;
    const sortedOverflow = [...overflowBag].sort(
      (a, b) =>
        (topoOrder.indexOf(a) !== -1 ? topoOrder.indexOf(a) : 0) -
        (topoOrder.indexOf(b) !== -1 ? topoOrder.indexOf(b) : 0)
    );

    const movedIds = new Set<number>([subjectId]);
    const startPeriod = advancePeriodForAssignment(evalYear, evalTerm);

    for (const subjId of sortedOverflow) {
      resolveSubjectRecursive(
        newPlan, subjId, startPeriod, graph, limitHours, movedIds
      );
    }

    return newPlan;
  }

  return newPlan;
}

function buildCandidatePeriods(
  targetPeriod: { year: number; term: number },
  minYear: number
): Array<{ year: number; term: number }> {
  const periods: Array<{ year: number; term: number }> = [];
  const seen = new Set<string>();

  const addPeriod = (period: { year: number; term: number }) => {
    if (period.year < minYear) return;
    const key = `${period.year}-${period.term}`;
    if (!seen.has(key)) {
      seen.add(key);
      periods.push(period);
    }
  };

  let current = { year: targetPeriod.year, term: targetPeriod.term };
  addPeriod(current);

  for (let i = 0; i < 6; i++) {
    current = advancePeriodForAssignment(current.year, current.term);
    addPeriod(current);
  }

  current = goBackOnePeriod(targetPeriod.year, targetPeriod.term);
  for (let i = 0; i < 6; i++) {
    addPeriod(current);
    current = goBackOnePeriod(current.year, current.term);
  }

  return periods;
}

/**
 * Ubica una materia con su bolsa y resuelve CASO 3 recursivo:
 * si mover N hacia adelante deja a sus dependientes en ≤ su nueva posición,
 * los reubica también.
 */
function resolveSubjectRecursive(
  plan: Plan,
  subjectId: number,
  defaultStart: { year: number; term: number },
  graph: SubjectGraph,
  limitHours: number,
  movedIds: Set<number>
): void {
  if (movedIds.has(subjectId)) return;

  const node = graph.nodes.get(subjectId);
  if (!node) return;

  // SOLUCIÓN: Calcular el punto de partida real basado en las correlativas.
  // Esto permite que findBestTerm aproveche y rellene huecos anteriores.
  let startPeriod = defaultStart;
  const latestPrereqPeriod = findLatestPrerequisitePeriodInPlan(node, plan);

  if (latestPrereqPeriod) {
    // El punto de partida es el cuatrimestre SIGUIENTE al de la última correlativa.
    startPeriod = advancePeriodForAssignment(
      latestPrereqPeriod.year,
      latestPrereqPeriod.term
    );
  }

  const target = findBestTerm(
    node.weekly_hours, plan, startPeriod.year, startPeriod.term, limitHours
  );

  addSubjectToPlan(plan, {
    plan_subject_id: node.plan_subject_id,
    subject_name: node.subject_name,
    weekly_hours: node.weekly_hours,
    credits: node.credits,
    weight: graph.unlockWeights.get(node.plan_subject_id) ?? 0,
    block_type: node.block_type,
  }, target.year, target.term);

  movedIds.add(subjectId);

  // CASO 3 recursivo: dependientes que quedaron en o antes de target
  const orphaned = findDependentSubjectsInPastOrPresent(plan, graph, subjectId, target);

  // Ordenar por unlock weight descendente: los que más desbloquean primero
  const weights = graph.unlockWeights;
  orphaned.sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0));

  const nextPeriod = advancePeriodForAssignment(target.year, target.term);

  for (const depId of orphaned) {
    if (movedIds.has(depId)) continue;

    const removed = removeSubjectFromPlan(plan, depId);
    if (!removed) continue;

    resolveSubjectRecursive(plan, depId, nextPeriod, graph, limitHours, movedIds);
  }
}

/**
 * CASO 5 recursivo: reubica correlativas que quedaron adelante del cursor
 * moviéndolas hacia atrás (y resolviendo SUS correlativas recursivamente).
 */
function resolvePrerequisiteRecursive(
  plan: Plan,
  subjectId: number,
  cursorPeriod: { year: number; term: number },
  graph: SubjectGraph,
  limitHours: number,
  movedIds: Set<number>,
  minYear?: number
): void {
  const node = graph.nodes.get(subjectId);
  if (!node || node.requires.length === 0) {
    return;
  }

  // 1) Recolectar correlativas que están en o después del cursor
  const prereqsToMove: number[] = [];
  for (const prereqId of node.requires) {
    if (movedIds.has(prereqId)) continue; // Ya fue movida en esta cascada
    const period = findSubjectInPlan(plan, prereqId);
    if (!period) continue; // No está en el plan, no hay que moverla

    // Si el prerequisito está en el mismo período o después del cursor, necesita moverse
    if (
      period.year > cursorPeriod.year ||
      (period.year === cursorPeriod.year && period.term >= cursorPeriod.term)
    ) {
      prereqsToMove.push(prereqId);
    }
  }

  if (prereqsToMove.length === 0) {
    return;
  }

  // 2) Ordenar por posición actual descendente: mover primero las correlativas que están más abajo en el plan.
  const weights = graph.unlockWeights;
  prereqsToMove.sort((a, b) => {
    const periodA = findSubjectInPlan(plan, a);
    const periodB = findSubjectInPlan(plan, b);
    if (periodA && periodB) {
      if (periodA.year !== periodB.year) {
        return periodB.year - periodA.year;
      }
      if (periodA.term !== periodB.term) {
        return periodB.term - periodA.term;
      }
    }
    return (weights.get(a) ?? 0) - (weights.get(b) ?? 0);
  });

  // 3) Resolver recursivamente las sub-correlativas de cada una
  for (const prereqId of prereqsToMove) {
    const prereqCursor = goBackOnePeriod(cursorPeriod.year, cursorPeriod.term);
    resolvePrerequisiteRecursive(plan, prereqId, prereqCursor, graph, limitHours, movedIds, minYear);
  }

  // 4) Re-colectar las que aún no fueron movidas (algunas pudieron resolverse en el paso 3)
  const remaining = prereqsToMove.filter(id => !movedIds.has(id));

  // Ordenar los remanentes de atrás hacia adelante para colocarlos primero en los espacios más lejanos.
  remaining.sort((a, b) => {
    const periodA = findSubjectInPlan(plan, a);
    const periodB = findSubjectInPlan(plan, b);
    if (periodA && periodB) {
      if (periodA.year !== periodB.year) {
        return periodB.year - periodA.year;
      }
      if (periodA.term !== periodB.term) {
        return periodB.term - periodA.term;
      }
    }
    return (weights.get(a) ?? 0) - (weights.get(b) ?? 0);
  });

  let currYear = cursorPeriod.year;
  let currTerm = cursorPeriod.term;

  for (const prereqId of remaining) {
    const prereqNode = graph.nodes.get(prereqId);
    if (!prereqNode) continue;

    removeSubjectFromPlan(plan, prereqId);

    const target = findBestTermBackwards(
      prereqNode.weekly_hours,
      plan,
      currYear,
      currTerm,
      limitHours,
      minYear,
      graph,
      prereqId
    );

    addSubjectToPlan(plan, {
    plan_subject_id: prereqNode.plan_subject_id,
    subject_name: prereqNode.subject_name,
    weekly_hours: prereqNode.weekly_hours,
    credits: prereqNode.credits,
    weight: weights.get(prereqId) ?? 0,
    block_type: prereqNode.block_type,
    }, target.year, target.term);

    movedIds.add(prereqId);

    const prev = goBackOnePeriod(target.year, target.term);
    currYear = prev.year;
    currTerm = prev.term;
  }
}

/**
 * Encuentra el período más lejano donde está asignado un prerrequisito.
 * Usado para determinar el "piso" académico al reubicar materias.
 */
function findLatestPrerequisitePeriodInPlan(
  subjectNode: SubjectGraphNode,
  plan: Plan
): { year: number; term: number } | null {
  let latestPeriod: { year: number; term: number } | null = null;

  for (const prereqId of subjectNode.requires) {
    const period = findSubjectInPlan(plan, prereqId);
    if (period) {
      if (
        !latestPeriod ||
        period.year > latestPeriod.year ||
        (period.year === latestPeriod.year && period.term > latestPeriod.term)
      ) {
        latestPeriod = period;
      }
    }
  }
  return latestPeriod;
}

/**
 * Encuentra el período de una materia en el plan.
 */
export function findSubjectInPlan(
  plan: Plan,
  subjectId: number
): { year: number; term: number } | null {
  for (const year of plan.years) {
    for (const semester of year.semesters) {
      if (semester.subjects.some(s => s.plan_subject_id === subjectId)) {
        return { year: year.year, term: semester.term };
      }
    }
  }
  return null;
}

/**
 * Remueve una materia del plan.
 * 
 * @returns Ubicación donde estaba, o null si no la encontró
 */
export function removeSubjectFromPlan(
  plan: Plan,
  subjectId: number
): { sourceYear: number; sourceTerm: number } | null {
  for (const yearPlan of plan.years) {
    for (const semester of yearPlan.semesters) {
      const index = semester.subjects.findIndex(s => s.plan_subject_id === subjectId);
      if (index !== -1) {
        const subject = semester.subjects[index];
        semester.total_hours -= subject.weekly_hours;
        semester.subjects.splice(index, 1);
        plan.total_credits = Math.max(0, plan.total_credits - (subject.credits || 0));
        return { sourceYear: yearPlan.year, sourceTerm: semester.term };
      }
    }
  }
  return null;
}

/**
 * Agrega una materia a un período específico del plan.
 */
export function addSubjectToPlan(
  plan: Plan,
  subject: PlannedSubject,
  year: number,
  term: number
): void {
  // Asegurar que el año existe
  let yearPlan = plan.years.find(y => y.year === year);
  if (!yearPlan) {
    yearPlan = {
      year,
      semesters: [
        { term: 1, subjects: [], total_hours: 0 },
        { term: 2, subjects: [], total_hours: 0 },
      ],
    };
    plan.years.push(yearPlan);
    plan.years.sort((a, b) => a.year - b.year); // Mantener orden
  }

  const semesterIndex = term === 1 ? 0 : 1;
  const semester = yearPlan.semesters[semesterIndex];

  semester.subjects.push(subject);
  semester.total_hours += subject.weekly_hours;
  plan.total_credits += subject.credits;
}

/**
 * Verifica si todos los requisitos de una materia están en períodos anteriores.
 */
export function hasPrerequisitesInPast(
  plan: Plan,
  graph: SubjectGraph,
  subjectId: number,
  targetPeriod: { year: number; term: number }
): boolean {
  const node = graph.nodes.get(subjectId);
  if (!node || node.requires.length === 0) return true;

  for (const prereqId of node.requires) {
    const prereqPeriod = findSubjectInPlan(plan, prereqId);
    
    if (prereqPeriod) {
      const isPast =
        prereqPeriod.year < targetPeriod.year ||
        (prereqPeriod.year === targetPeriod.year && prereqPeriod.term < targetPeriod.term);
      
      if (!isPast) {
        return false; // Requisito no está en el pasado
      }
    }
  }

  return true;
}

/**
 * Retrocede un período cronológicamente.
 */
export function goBackOnePeriod(year: number, term: number): { year: number; term: number } {
  if (term === 2) {
    return { year, term: 1 };
  } else {
    return { year: year - 1, term: 2 };
  }
}

/**
 * Encuentra dependientes que quedaron en el pasado o período actual.
 * CASO 3.
 */
export function findDependentSubjectsInPastOrPresent(
  plan: Plan,
  graph: SubjectGraph,
  subjectId: number,
  targetPeriod: { year: number; term: number }
): number[] {
  const node = graph.nodes.get(subjectId);
  if (!node) return [];

  const affected: number[] = [];

  for (const dependentId of node.required_by) {
    const depPeriod = findSubjectInPlan(plan, dependentId);
    
    if (depPeriod) {
      const isPastOrSame =
        depPeriod.year < targetPeriod.year ||
        (depPeriod.year === targetPeriod.year && depPeriod.term <= targetPeriod.term);
      
      if (isPastOrSame) {
        affected.push(dependentId);
      }
    }
  }

  return affected;
}

/**
 * Obtiene todas las materias de un período.
 */
export function getSubjectsInPeriod(
  plan: Plan,
  year: number,
  term: number
): PlannedSubject[] {
  const yearPlan = plan.years.find(y => y.year === year);
  if (!yearPlan) return [];

  const semesterIndex = term === 1 ? 0 : 1;
  const semester = yearPlan.semesters[semesterIndex];

  return semester?.subjects ?? [];
}

/**
 * Valida si una cadena de prerequisitos es movible hacia atrás.
 */
function validatePrereqChainMovable(
  startNode: SubjectGraphNode,
  targetPeriod: { year: number; term: number },
  graph: SubjectGraph,
  minYear: number
): { valid: boolean; depth: number; warning?: string } {
  // Calcular profundidad de la cadena de prerequisitos
  const depth = calculateChainDepth(startNode, graph, new Set());

  // Calcular cuatrimestres disponibles hacia atrás desde el período objetivo
  const availableQuarters =
    (targetPeriod.year - minYear) * 2 + (targetPeriod.term - 1);

  // La profundidad es el número de niveles, necesitamos `depth - 1` cuatrimestres.
  if (depth - 1 > availableQuarters) {
    return {
      valid: false,
      depth,
      warning: `El movimiento no es posible. Esta materia requiere una cadena de ${
        depth - 1
      } correlativas, pero solo hay ${availableQuarters} cuatrimestres disponibles en el pasado.`,
    };
  }

  return { valid: true, depth };
}

/**
 * Calcula la profundidad máxima de la cadena de prerequisitos de un nodo.
 * Una materia sin prerequisitos tiene profundidad 1.
 * Una materia con un prerequisito que no tiene prerequisitos, tiene profundidad 2.
 */
function calculateChainDepth(
  node: SubjectGraphNode,
  graph: SubjectGraph,
  visited: Set<number>
): number {
  // Caso base: no tiene prerequisitos
  if (node.requires.length === 0) return 1;

  // Evitar ciclos infinitos
  if (visited.has(node.plan_subject_id)) return 0;
  visited.add(node.plan_subject_id);

  let maxDepth = 0;
  for (const prereqId of node.requires) {
    const prereqNode = graph.nodes.get(prereqId);
    if (prereqNode) {
      maxDepth = Math.max(maxDepth, calculateChainDepth(prereqNode, graph, visited));
    }
  }

  visited.delete(node.plan_subject_id); // Permitir que este nodo sea visitado por otras ramas

  return 1 + maxDepth;
}
