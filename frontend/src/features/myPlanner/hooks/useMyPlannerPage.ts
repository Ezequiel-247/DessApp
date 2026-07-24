import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/app/AuthContext";
import type { AuthUser } from "@/app/AuthContext";
import { usePlanner } from "@/features/myPlanner/customPlan/hooks/usePlanner";
import { usePlannerSetup } from "@/features/myPlanner/hooks/usePlannerSetup";
import { usePlanManager } from "@/features/myPlanner/customPlan/hooks/usePlanManager";
import { useSabbatical } from "@/features/myPlanner/customPlan/hooks/useSabbatical";
import { useElectiveChoices } from "@/features/myPlanner/customPlan/hooks/useElectiveChoices";
import { useUnahurChoices } from "@/features/myPlanner/customPlan/hooks/useUnahurChoices";
import { fetchPlannerData } from "@/features/myPlanner/customPlan/services/plannerDataService";
import { getStudent } from "@/entities/Student";
import type { SabbaticalPeriod } from "@/features/myPlanner/customPlan/services/sabbaticalService";
import type { ElectiveBlock, ElectiveChoice } from "@/features/myPlanner/customPlan/services/electiveChoiceService";
import type { UnahurBlock, UnahurChoice } from "@/features/myPlanner/customPlan/services/unahurChoiceService";
import type {
  SavedPlan,
  PlannerDataResponse,
  Plan,
  SubjectGraph,
  SubjectClassification,
} from "@/features/myPlanner/customPlan/model/planner";

export interface MyPlannerPageVM {
  user: AuthUser | null;
  view: "menu" | "simulator" | "planner";
  setView: (v: "menu" | "simulator" | "planner") => void;
  // Selector de carrera (si el alumno tiene más de una inscripción)
  enrollmentOptions: any[];
  selectedEnrollmentId: string;
  handleEnrollmentChange: (id: string) => void;
  // Planes agrupados por carrera — alimenta la "mini sección" del dashboard cuando
  // el alumno cursa más de una. Siempre separados, nunca un filtro global.
  plansByEnrollment: { enrollment: any; plans: SavedPlan[] }[];
  handleNewPlanForEnrollment: (enrollmentId: string) => void;
  handleRenamePlanById: (planId: number, name: string) => Promise<boolean>;
  handleDeletePlanById: (planId: number) => Promise<void>;
  isLoadingCareerData: boolean;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  handleCancelEdit: () => Promise<void>;
  activeYear: number;
  setActiveYear: (y: number) => void;
  moveSubject: (
    subjectId: string,
    sourceYear: number,
    sourceSem: number,
    targetYear: number,
    targetSem: number,
    onError?: (error: string) => void,
  ) => void;
  moveFinalEvent: (
    academicRecordId: number,
    finalExamId: number | undefined,
    targetYear: number,
    targetTerm: number,
    onError?: (error: string) => void,
  ) => void;
  data: Plan | null;
  isLoading: boolean;
  error: string | null;
  plans: SavedPlan[];
  plansLoading: boolean;
  activePlanId: number | null;
  activePlanName: string;
  previewData: Plan | null;
  setupOpen: boolean;
  hours: number;
  effectiveHours: number;
  adjustHours: (delta: number) => void;
  closeSetup: () => void;
  cancelSetup: () => void;
  saveOpen: boolean;
  setSaveOpen: (v: boolean) => void;
  isSaving: boolean;
  deleteOpen: boolean;
  setDeleteOpen: (v: boolean) => void;
  isDeleting: boolean;
  handleNewPlan: () => void;
  handleCreateNewPlan: () => void;
  handleDeletePlan: () => void;
  handleSave: (name: string) => void;
  handleLoadPlan: (planId: number) => void;
  handleSelectPlan: (planId: number) => void;
  refreshPlanner: () => void;
  duplicate: (planId: number) => void;
  // Nuevos: grafo y clasificación para validaciones locales
  graph: SubjectGraph | null;
  classification: Map<number, SubjectClassification> | null;
  // Nombre/horas/créditos de cada plan_subject del pool (incluye electivas no elegidas
  // todavía, que no aparecen en `data` porque generatePlan no las proyecta).
  planSubjectInfoById: Map<number, { name: string; weekly_hours: number; credits: number }>;
  // Año/cuatrimestre actual real (no confundir con años ya cursados que ahora también
  // aparecen en `data.years` en su posición histórica) — lo necesita el modal de
  // sabático para no ofrecer un período que ya pasó.
  currentPeriod: { year: number; term: number } | null;
  // Año/cuatrimestre sabático
  sabbaticalOpen: boolean;
  openSabbatical: () => void;
  closeSabbatical: () => void;
  sabbaticals: SabbaticalPeriod[];
  isSabbaticalSaving: boolean;
  addSabbatical: (year: number, terms: number[]) => Promise<boolean>;
  cancelSabbatical: (year: number, term?: number) => Promise<boolean>;
  // Electivas (bloques "elegí N de M")
  electivesOpen: boolean;
  openElectives: () => void;
  closeElectives: () => void;
  electiveBlocks: ElectiveBlock[];
  electiveChoices: ElectiveChoice[];
  isElectiveSaving: boolean;
  saveElectiveChoices: (selections: { electiveBlockId: number; planSubjectId: number }[]) => Promise<boolean>;
  // Materias UNAHUR (catálogo abierto, 1 elección por bloque)
  unahurOpen: boolean;
  openUnahur: () => void;
  closeUnahur: () => void;
  unahurBlocks: UnahurBlock[];
  unahurChoices: UnahurChoice[];
  isUnahurSaving: boolean;
  unahurPoolPlanSubjects: { id: number; name: string; weekly_hours: number }[];
  saveUnahurChoices: (selections: { unahurBlockId: number; planSubjectId: number }[]) => Promise<boolean>;
}

export function useMyPlannerPage(): MyPlannerPageVM {
  const { user } = useAuth();

  const [view, setView] = useState<"menu" | "simulator" | "planner">("menu");
  const [isEditing, setIsEditing] = useState(false);

  // Selector de carrera: un alumno puede tener más de una inscripción activa. Comparte
  // la misma clave de localStorage que Mi Progreso / Historia Académica para que la
  // elección quede consistente en toda la app, en vez de una preferencia por página.
  const [enrollmentOptions, setEnrollmentOptions] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    getStudent(user.id).then((student) => {
      const enrollments = (student.enrollments ?? []).filter((e: any) => e.studyPlanId != null);
      setEnrollmentOptions(enrollments);
      const saved = localStorage.getItem("selected_enrollment_id");
      if (saved && enrollments.some((e: any) => String(e.id) === saved)) {
        setSelectedEnrollmentId(saved);
      } else if (enrollments.length > 0) {
        setSelectedEnrollmentId(String(enrollments[0].id));
      }
    }).catch(() => setEnrollmentOptions([]));
  }, [user]);

  // NUEVO: Fetch planner data al montar
  const [plannerData, setPlannerData] = useState<PlannerDataResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [plannerRefreshKey, setPlannerRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setPlannerData(null);
      return;
    }

    setDataLoading(true);
    setDataError(null);

    fetchPlannerData(user.id, selectedEnrollmentId || undefined)
      .then(data => {
        setPlannerData(data);
      })
      .catch(err => {
        console.error("Error fetching planner data:", err);
        setDataError(err.message || "Error al cargar datos del planificador");
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [user, selectedEnrollmentId]);

  const { setupOpen, hours, adjustHours, openSetup, closeSetup, cancelSetup } = usePlannerSetup();

  const plannerHours = hours;
  const refreshPlanner = useCallback(() => {
    if (!user) return;
    setPlannerRefreshKey((value) => value + 1);
    setDataLoading(true);
    setDataError(null);

    fetchPlannerData(user.id, selectedEnrollmentId || undefined)
      .then(data => {
        setPlannerData(data);
      })
      .catch(err => {
        console.error("Error refreshing planner data:", err);
        setDataError(err.message || "Error al recargar datos del planificador");
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [user, selectedEnrollmentId]);

  // Declarado antes de usePlanner porque hace falta para calcular
  // electivePoolIds/chosenElectiveIds que se le pasan como parámetro.
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [previewPlanId, setPreviewPlanId] = useState<number | null>(null);

  // Cambiar de carrera es un contexto totalmente distinto (otras materias, otros
  // planes guardados) — se resetea la selección de plan activo para que vuelva a
  // auto-seleccionarse el primero de la carrera nueva (ver el efecto más abajo).
  const handleEnrollmentChange = useCallback((id: string) => {
    setSelectedEnrollmentId(id);
    localStorage.setItem("selected_enrollment_id", id);
    setActivePlanId(null);
    setPreviewPlanId(null);
    setView("menu");
  }, []);

  const planSubjectInfoById = useMemo(
    () =>
      new Map(
        (plannerData?.planSubjects ?? []).map((ps) => [
          ps.id,
          { name: ps.subject.name, weekly_hours: ps.weekly_hours, credits: ps.credits },
        ])
      ),
    [plannerData]
  );

  const studyPlanId = plannerData?.enrollment?.study_plan_id ?? null;
  const {
    blocks: electiveBlocks,
    choices: electiveChoices,
    isSaving: isElectiveSaving,
    refresh: refreshElectiveChoices,
    addChoice: persistElectiveChoice,
    removeChoice: persistRemoveElectiveChoice,
  } = useElectiveChoices(studyPlanId, activePlanId);

  // Todas las materias que pertenecen a ALGÚN bloque electivo (el pool completo de
  // opciones), y el subconjunto que el estudiante ya eligió para este plan puntual.
  // generatePlan() usa esto para no proyectar automáticamente TODAS las opciones.
  const electivePoolIds = useMemo(
    () =>
      new Set(
        electiveBlocks.flatMap((block) => (block.PlanElectiveBlockSubjects ?? []).map((link) => link.id_plan_subject))
      ),
    [electiveBlocks]
  );
  const chosenElectiveIds = useMemo(
    () => new Set(electiveChoices.map((choice) => choice.plan_subject_id)),
    [electiveChoices]
  );

  const {
    blocks: unahurBlocks,
    choices: unahurChoices,
    isSaving: isUnahurSaving,
    refresh: refreshUnahurChoices,
    addChoice: persistUnahurChoice,
    removeChoice: persistRemoveUnahurChoice,
  } = useUnahurChoices(studyPlanId, activePlanId);

  // Todas las materias UNAHUR del plan (catálogo abierto, sin pool curado por bloque) y
  // el subconjunto que el estudiante ya eligió para este plan puntual. generatePlan() usa
  // esto para no proyectar automáticamente TODAS las materias UNAHUR a la vez.
  const unahurPoolIds = useMemo(
    () =>
      new Set(
        (plannerData?.planSubjects ?? [])
          .filter((ps) => ps.subject.is_unahur)
          .map((ps) => ps.id)
      ),
    [plannerData]
  );
  const chosenUnahurIds = useMemo(
    () => new Set(unahurChoices.map((choice) => choice.plan_subject_id)),
    [unahurChoices]
  );
  const unahurPoolPlanSubjects = useMemo(
    () =>
      (plannerData?.planSubjects ?? [])
        .filter((ps) => ps.subject.is_unahur)
        .map((ps) => ({ id: ps.id, name: ps.subject.name, weekly_hours: ps.weekly_hours })),
    [plannerData]
  );

  const {
    data,
    activeYear,
    setActiveYear,
    moveSubject,
    moveFinalEvent,
    applySabbatical,
    undoSabbatical,
    addElective,
    removeElective,
    isLoading,
    error,
    loadFromSaved,
    getPlanSnapshot,
    generate,
    graph,
    classification,
  } = usePlanner(
    plannerData,
    plannerHours,
    plannerRefreshKey,
    electivePoolIds,
    chosenElectiveIds,
    unahurPoolIds,
    chosenUnahurIds,
    activePlanId != null
  );

  // Reconciliación automática: si el estudiante ya tiene un registro académico para una
  // electiva o materia UNAHUR (ej: por carga de un archivo Excel) pero nunca la "eligió"
  // en estos modales, generatePlan() ya la excluye correctamente de la proyección futura,
  // pero el modal la sigue mostrando sin marcar y el bloque nunca llega a "N/N elegidas".
  // Se persiste la elección sola apenas se detecta, para que quede reflejada sin que el
  // estudiante tenga que volver a elegir algo que ya cursó.
  useEffect(() => {
    if (!classification) return;

    for (const block of electiveBlocks) {
      for (const link of block.PlanElectiveBlockSubjects ?? []) {
        const status = classification.get(link.id_plan_subject);
        const alreadyStarted = status && status !== 'faltante';
        if (alreadyStarted && !chosenElectiveIds.has(link.id_plan_subject)) {
          persistElectiveChoice(block.id, link.id_plan_subject);
        }
      }
    }
  }, [classification, electiveBlocks, chosenElectiveIds, persistElectiveChoice]);

  useEffect(() => {
    if (!classification || !plannerData) return;

    const recordByPlanSubject = new Map(
      plannerData.academicRecords.map((r) => [r.plan_subject_id, r])
    );

    for (const planSubject of unahurPoolPlanSubjects) {
      const status = classification.get(planSubject.id);
      const alreadyStarted = status && status !== 'faltante';
      if (!alreadyStarted || chosenUnahurIds.has(planSubject.id)) continue;

      const record = recordByPlanSubject.get(planSubject.id);
      const matchingBlock =
        unahurBlocks.find(
          (b) =>
            record &&
            b.suggested_year === record.year &&
            (b.suggested_term == null || b.suggested_term === record.semester)
        ) ?? unahurBlocks.find((b) => !unahurChoices.some((c) => c.id_unahur_block === b.id));

      if (matchingBlock) {
        persistUnahurChoice(matchingBlock.id, planSubject.id);
      }
    }
  }, [classification, plannerData, unahurPoolPlanSubjects, chosenUnahurIds, unahurBlocks, unahurChoices, persistUnahurChoice]);

  const effectiveHours = data?.limit_hours ?? hours;

  const snapshotCallback = useCallback(() => getPlanSnapshot(), [getPlanSnapshot]);
  // Sin enrollmentId: siempre trae TODOS los planes del alumno (todas las carreras).
  // El scoping por carrera se hace acá abajo, del lado del cliente, a partir de qué
  // study_plan pertenece cada plan (ver getEnrollmentIdForPlan) — así un alumno con más
  // de una carrera activa nunca depende de un filtro global reactivo para no mezclarlas.
  const {
    plans: allPlans,
    isLoading: plansLoading,
    isSaving,
    save,
    update,
    rename,
    createFromPlannerData,
    loadPlan,
    duplicate,
    remove,
  } = usePlanManager(snapshotCallback, effectiveHours, undefined);

  // Un plan guardado no tiene una columna propia de carrera — se infiere del
  // study_plan al que pertenecen sus materias (todas las materias de un plan
  // vienen del mismo study_plan, porque generatePlan()/el canvas solo ofrece
  // materias de UNA carrera a la vez).
  const getEnrollmentIdForPlan = useCallback(
    (plan: SavedPlan): string | null => {
      const studyPlanId = plan.items?.[0]?.plan_subject?.id_study_plan;
      if (studyPlanId == null) return null;
      const match = enrollmentOptions.find((e: any) => e.studyPlanId === studyPlanId);
      return match ? String(match.id) : null;
    },
    [enrollmentOptions]
  );

  // Planes agrupados por carrera, para la "mini sección" del dashboard cuando el
  // alumno cursa más de una. Un plan cuyo study_plan ya no matchea ninguna
  // inscripción activa (o que todavía no tiene materias) no entra en ningún grupo.
  const plansByEnrollment = useMemo(
    () =>
      enrollmentOptions.map((e: any) => ({
        enrollment: e,
        plans: allPlans.filter((p) => getEnrollmentIdForPlan(p) === String(e.id)),
      })),
    [enrollmentOptions, allPlans, getEnrollmentIdForPlan]
  );

  // Planes de la carrera actualmente activa — es lo que se le pasa al selector
  // "cambiar de plan" dentro del detalle, para que nunca pueda saltar a un plan de
  // otra carrera por accidente.
  const plans = useMemo(
    () => allPlans.filter((p) => getEnrollmentIdForPlan(p) === selectedEnrollmentId),
    [allPlans, selectedEnrollmentId, getEnrollmentIdForPlan]
  );

  const [saveOpen, setSaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sabbaticalOpen, setSabbaticalOpen] = useState(false);
  const {
    sabbaticals,
    isSaving: isSabbaticalSaving,
    refresh: refreshSabbaticals,
    addSabbatical: persistSabbatical,
    cancelSabbatical: persistCancelSabbatical,
  } = useSabbatical(activePlanId);

  const openSabbatical = useCallback(() => {
    setSabbaticalOpen(true);
    refreshSabbaticals();
  }, [refreshSabbaticals]);

  const closeSabbatical = useCallback(() => {
    setSabbaticalOpen(false);
  }, []);

  // Reubica en el backend los sabáticos ya guardados cuya etiqueta año/cuatrimestre
  // cambió como efecto del corrimiento (ej: se agregó un sabático más temprano que
  // otro ya existente, y ese otro pasó a corresponder a un período distinto).
  const reconcileMovedSabbaticals = useCallback(
    async (moved: { from: { year: number; term: number }; to: { year: number; term: number } }[]) => {
      for (const { from, to } of moved) {
        await persistCancelSabbatical(from.year, from.term);
        await persistSabbatical(to.year, [to.term]);
      }
    },
    [persistCancelSabbatical, persistSabbatical]
  );

  // Aplicar/cancelar un sabático (o elegir/deselecionar una electiva) borra o crea
  // una fila marcadora en el backend DE INMEDIATO, pero el cambio in-memory (vía
  // usePlanner) solo se persiste en `CustomStudyPlanItem` cuando se guarda el plan.
  // Si el usuario no guarda después (o cancela cambios sin volver a guardar), el
  // marcador y las posiciones reales quedan desincronizados. Para que nunca queden
  // huérfanos, cada una de estas acciones dispara automáticamente un guardado del
  // plan, sin depender de un click manual en "Guardar" — ver el useEffect de más
  // abajo (usa `data` como gate porque getPlanSnapshot() lee `data` por closure, y
  // necesitamos esperar a que el estado ya refleje el cambio antes de guardar).
  const pendingAutoPersistRef = useRef(false);

  const addSabbatical = useCallback(
    async (year: number, terms: number[]): Promise<boolean> => {
      const ok = await persistSabbatical(year, terms);
      if (!ok) return false;
      applySabbatical(year, terms, sabbaticals, reconcileMovedSabbaticals);
      pendingAutoPersistRef.current = true;
      return true;
    },
    [persistSabbatical, applySabbatical, sabbaticals, reconcileMovedSabbaticals]
  );

  const cancelSabbatical = useCallback(
    async (year: number, term?: number): Promise<boolean> => {
      const ok = await persistCancelSabbatical(year, term);
      if (!ok) return false;
      undoSabbatical(year, term, sabbaticals, reconcileMovedSabbaticals);
      pendingAutoPersistRef.current = true;
      return true;
    },
    [persistCancelSabbatical, undoSabbatical, sabbaticals, reconcileMovedSabbaticals]
  );

  const [electivesOpen, setElectivesOpen] = useState(false);

  const openElectives = useCallback(async () => {
    await refreshElectiveChoices();
    setElectivesOpen(true);
  }, [refreshElectiveChoices]);

  const closeElectives = useCallback(() => {
    setElectivesOpen(false);
  }, []);

  const saveElectiveChoices = useCallback(
    async (selections: { electiveBlockId: number; planSubjectId: number }[]): Promise<boolean> => {
      const currentIds = new Set(electiveChoices.map(c => c.plan_subject_id));
      const newIds = new Set(selections.map(s => s.planSubjectId));

      for (const choice of electiveChoices) {
        if (!newIds.has(choice.plan_subject_id)) {
          const ok = await persistRemoveElectiveChoice(choice.plan_subject_id);
          if (!ok) return false;
          removeElective(choice.plan_subject_id);
        }
      }

      for (const { electiveBlockId, planSubjectId } of selections) {
        if (!currentIds.has(planSubjectId)) {
          const ok = await persistElectiveChoice(electiveBlockId, planSubjectId);
          if (!ok) return false;
          addElective(planSubjectId, (msg) => setDataError(msg));
        }
      }

      pendingAutoPersistRef.current = true;
      return true;
    },
    [electiveChoices, persistElectiveChoice, persistRemoveElectiveChoice, addElective, removeElective]
  );

  const [unahurOpen, setUnahurOpen] = useState(false);

  const openUnahur = useCallback(async () => {
    await refreshUnahurChoices();
    setUnahurOpen(true);
  }, [refreshUnahurChoices]);

  const closeUnahur = useCallback(() => {
    setUnahurOpen(false);
  }, []);

  const saveUnahurChoices = useCallback(
    async (selections: { unahurBlockId: number; planSubjectId: number }[]): Promise<boolean> => {
      const currentIds = new Set(unahurChoices.map(c => c.plan_subject_id));
      const newIds = new Set(selections.map(s => s.planSubjectId));

      for (const choice of unahurChoices) {
        if (!newIds.has(choice.plan_subject_id)) {
          const ok = await persistRemoveUnahurChoice(choice.plan_subject_id);
          if (!ok) return false;
          removeElective(choice.plan_subject_id);
        }
      }

      for (const { unahurBlockId, planSubjectId } of selections) {
        if (!currentIds.has(planSubjectId)) {
          const ok = await persistUnahurChoice(unahurBlockId, planSubjectId);
          if (!ok) return false;
          addElective(planSubjectId, (msg) => setDataError(msg));
        }
      }

      pendingAutoPersistRef.current = true;
      return true;
    },
    [unahurChoices, persistUnahurChoice, persistRemoveUnahurChoice, addElective, removeElective]
  );

  useEffect(() => {
    if (!pendingAutoPersistRef.current) return;
    pendingAutoPersistRef.current = false;
    if (activePlanId) {
      update(activePlanId, activePlanName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const activePlanName = useMemo(() => {
    const plan = plans.find(p => p.id === activePlanId);
    return plan?.name || "";
  }, [plans, activePlanId]);

  const previewData = useMemo(() => {
    if (data) return data;
    const planId = previewPlanId ?? plans[0]?.id ?? null;
    if (!planId) return null;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return null;
    return null;
  }, [data, plans, previewPlanId]);

  const handleSelectPlan = useCallback(
    async (planId: number) => {
      setPreviewPlanId(planId);
      const saved = await loadPlan(planId);
      if (saved) {
        // El plan seleccionado puede pertenecer a una carrera distinta de la
        // actual (ej. se eligió desde la mini-sección de otra carrera) — hay que
        // alinear `selectedEnrollmentId` con la suya para que `plannerData`
        // (materias/registros académicos) se recalcule para la carrera correcta,
        // en vez de arrastrar la que estaba activa antes de este click.
        const planEnrollmentId = getEnrollmentIdForPlan(saved);
        if (planEnrollmentId && planEnrollmentId !== selectedEnrollmentId) {
          setSelectedEnrollmentId(planEnrollmentId);
          localStorage.setItem("selected_enrollment_id", planEnrollmentId);
        }
        setActivePlanId(planId);
        loadFromSaved(saved);
      }
    },
    [loadPlan, loadFromSaved, getEnrollmentIdForPlan, selectedEnrollmentId]
  );

  useEffect(() => {
    // Espera a que `plannerData` esté listo: `loadFromSaved` necesita `classification`
    // (derivada de plannerData) para recalcular los finales pendientes. Sin este guard,
    // en la carga inicial gana la carrera cualquiera de los dos fetches y a veces
    // `loadFromSaved` corre con `classification` todavía en null, perdiendo el badge
    // "Final Pendiente" hasta la próxima recarga manual del planner.
    if (plans.length > 0 && activePlanId == null && !plansLoading && plannerData) {
      handleSelectPlan(plans[0].id);
    }
  }, [plans, activePlanId, plansLoading, handleSelectPlan, plannerData]);

  // Cuando se agrega/edita un registro académico en cualquier lado (carga manual,
  // importación de Excel), solo se pide refrescar los datos crudos acá. La
  // reconciliación del plan activo (efecto de abajo) NO puede dispararse desde este
  // mismo handler: refreshPlanner() no devuelve una promesa, así que llamar a
  // handleSelectPlan() en la misma tanda usaría el `classification` de ANTES del
  // refresh (closure vieja) y la reconciliación llegaría un paso tarde.
  useEffect(() => {
    const handleAcademicRecordsChanged = () => {
      refreshPlanner();
    };

    window.addEventListener("academic-records:updated", handleAcademicRecordsChanged);
    return () => {
      window.removeEventListener("academic-records:updated", handleAcademicRecordsChanged);
    };
  }, [refreshPlanner]);

  // Reconcilia el plan guardado activo cada vez que `plannerData` cambia DE VERDAD
  // (no en la carga inicial, donde activePlanId todavía es null y lo maneja el efecto
  // de arriba). Al depender de `plannerData` en vez de dispararse a mano junto con
  // refreshPlanner(), este efecto solo corre en el render donde `classification` ya
  // está recalculada — mismo camino que loadFromSaved usa al abrir un plan, que
  // descarta del cronograma las materias que pasaron a estar resueltas (el check
  // `alreadyResolved` ahí) sin tocar el resto del acomodo manual del alumno.
  // No se hace si está editando: pisaría cambios sin guardar todavía.
  useEffect(() => {
    if (activePlanId == null || isEditing) return;
    handleSelectPlan(activePlanId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannerData]);

  const handleLoadPlan = useCallback(
    async (planId: number) => {
      console.log("📥 handleLoadPlan → cargando plan", planId);
      await handleSelectPlan(planId);
      setIsEditing(false);
      setView("planner");
    },
    [handleSelectPlan]
  );

  const handleNewPlan = useCallback(() => {
    openSetup();
  }, [openSetup]);

  // Igual que handleNewPlan, pero para cuando el punto de partida ya sabe para qué
  // carrera es (ej. el botón "Crear plan" de la tarjeta de una carrera puntual en
  // la mini-sección) — precarga esa carrera en el modal antes de abrirlo.
  const handleNewPlanForEnrollment = useCallback(
    (enrollmentId: string) => {
      handleEnrollmentChange(enrollmentId);
      openSetup();
    },
    [handleEnrollmentChange, openSetup]
  );

  const handleCreateNewPlan = useCallback(async () => {
    closeSetup();
    const newPlan = generate();
    if (!newPlan) return;
    const saved = await createFromPlannerData(newPlan, "Nuevo Plan", hours);
    if (saved) {
      setActivePlanId(saved.id);
      setPreviewPlanId(saved.id);
    }
    setView("planner");
  }, [hours, generate, createFromPlannerData, closeSetup]);

  const handleCancelEdit = useCallback(async () => {
    if (activePlanId) {
      await handleSelectPlan(activePlanId);
    }
    setIsEditing(false);
  }, [activePlanId, handleSelectPlan, setIsEditing]);

  const handleDeletePlan = useCallback(async () => {
    if (activePlanId == null) return;
    setIsDeleting(true);

    const currentIndex = plans.findIndex(p => p.id === activePlanId);
    const nextPlan =
      plans.length > 1
        ? plans[currentIndex < plans.length - 1 ? currentIndex + 1 : currentIndex - 1]
        : null;

    await remove(activePlanId);

    setDeleteOpen(false);
    setIsDeleting(false);

    if (nextPlan) {
      handleSelectPlan(nextPlan.id);
      setIsEditing(false);
    } else {
      setActivePlanId(null);
      setPreviewPlanId(null);
      setView("menu");
    }
  }, [activePlanId, plans, remove, handleSelectPlan]);

  // Variantes "por id" para la mini-sección del dashboard: a diferencia de
  // handleDeletePlan/handleSave, operan sobre un plan que puede no ser el activo
  // (ej. borrar/renombrar el plan de OTRA carrera sin haber entrado a verlo antes).
  const handleRenamePlanById = useCallback(
    async (planId: number, name: string): Promise<boolean> => {
      return rename(planId, name);
    },
    [rename]
  );

  const handleDeletePlanById = useCallback(
    async (planId: number) => {
      const wasActive = planId === activePlanId;
      await remove(planId);
      if (wasActive) {
        setActivePlanId(null);
        setPreviewPlanId(null);
        setView("menu");
      }
    },
    [activePlanId, remove]
  );

  const handleSave = useCallback(
    async (name: string) => {
      if (isEditing && activePlanId) {
        const ok = await update(activePlanId, name);
        if (ok) {
          setSaveOpen(false);
          setIsEditing(false);
        }
      } else {
        const result = await save(name);
        if (result) {
          setActivePlanId(result.id);
          setPreviewPlanId(result.id);
          setSaveOpen(false);
        }
      }
    },
    [isEditing, activePlanId, update, save]
  );

  return {
    user,
    view,
    setView,
    enrollmentOptions,
    selectedEnrollmentId,
    handleEnrollmentChange,
    plansByEnrollment,
    handleNewPlanForEnrollment,
    handleRenamePlanById,
    handleDeletePlanById,
    isLoadingCareerData: dataLoading,
    isEditing,
    setIsEditing,
    handleCancelEdit,
    activeYear,
    setActiveYear,
    moveSubject,
    moveFinalEvent,
    data,
    isLoading: isLoading || dataLoading,
    error: error || dataError,
    plans,
    plansLoading,
    activePlanId,
    activePlanName,
    previewData,
    setupOpen,
    hours,
    effectiveHours,
    adjustHours,
    closeSetup,
    cancelSetup,
    saveOpen,
    setSaveOpen,
    isSaving,
    deleteOpen,
    setDeleteOpen,
    isDeleting,
    handleNewPlan,
    handleCreateNewPlan,
    handleDeletePlan,
    handleSave,
    handleLoadPlan,
    handleSelectPlan,
    refreshPlanner,
    duplicate,
    graph,
    classification,
    planSubjectInfoById,
    // plannerData.currentPeriod.year NO es un año calendario — es el "año de cursada"
    // relativo a la inscripción (1, 2, 3...), un dato distinto ya documentado como
    // trampa en IMPLEMENTATION_ROADMAP.md. El resto del código lo descarta si no
    // parece un año real; acá se hace lo mismo antes de exponerlo.
    currentPeriod: plannerData?.currentPeriod
      ? {
          year: plannerData.currentPeriod.year >= 1900 ? plannerData.currentPeriod.year : new Date().getFullYear(),
          term: plannerData.currentPeriod.term,
        }
      : null,
    sabbaticalOpen,
    openSabbatical,
    closeSabbatical,
    sabbaticals,
    isSabbaticalSaving,
    addSabbatical,
    cancelSabbatical,
    electivesOpen,
    openElectives,
    closeElectives,
    electiveBlocks,
    electiveChoices,
    isElectiveSaving,
    saveElectiveChoices,
    unahurOpen,
    openUnahur,
    closeUnahur,
    unahurBlocks,
    unahurChoices,
    isUnahurSaving,
    unahurPoolPlanSubjects,
    saveUnahurChoices,
  };
}


