import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { getInstitutes } from "@/entities/Institute";
import { getCareers } from "@/entities/Career";
import { getSubjects } from "@/entities/Subject";
import { getCorrelativities } from "@/entities/Correlativity";
import { getActivities } from "@/entities/Activity";
import { getPlan, createPlan, replacePlan } from "@/entities/Plan";
import { getPlanSubjects } from "@/entities/PlanSubject";
import { getUnahurBlocks } from "@/entities/UnahurBlock";
import { getElectiveBlocks } from "@/entities/ElectiveBlock";
import { getCreditBlocks } from "@/entities/CreditBlock";
import type { ReplacePlanPayload } from "@/entities/Plan";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { MobileListDrawer } from "@/widgets/ui/MobileListDrawer";
import { StatusBadge } from "@/widgets/ui/StatusBadge";
import { PlanInfoCard } from "@/features/plans";
import { StepIndicator } from "./wizard/StepIndicator";
import { PlanBreakdownSection } from "./wizard/PlanBreakdownSection";
import { StepInfoPlan } from "./wizard/StepInfoPlan";
import { StepAddSubjects, type AddedSubject } from "./wizard/StepAddSubjects";
import { StepCreateBlocks, type UnahurBlockDraft, type ElectiveBlockDraft } from "./wizard/StepCreateBlocks";
import { StepCreditBlocks, type CreditBlockDraft } from "./wizard/StepCreditBlocks";
import { StepResume } from "./wizard/StepResume";

const STEPS = [
  { id: "info",     label: "Información del plan" },
  { id: "subjects", label: "Agregar materias" },
  { id: "blocks",   label: "Creación de bloques" },
  { id: "credits",  label: "Bloques de créditos" },
  { id: "resume",   label: "Resumen del plan" },
];

interface Props {
  onClose: () => void;
  planId?: string;
}

export interface PlanDraft {
  name: string;
  status: string;
  instituteId: string;
  careerId: string;
  duration: number;
  minTotalCredits: number;
}

function defaultDraft(): PlanDraft {
  return { name: "", status: "vigente", instituteId: "", careerId: "", duration: 1, minTotalCredits: 0 };
}

const STATUS_VARIANTS: Record<string, string> = {
  vigente: "positive", en_transicion: "warning", discontinuado: "neutral",
};
const STATUS_LABELS: Record<string, string> = {
  vigente: "Vigente", en_transicion: "En transición", discontinuado: "Discontinuado",
};
function statusVariant(s: string) { return STATUS_VARIANTS[s] ?? "neutral"; }
function statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }

type ViewMode = "years" | "activities" | "electives";

export function PlanCreationWizard({ onClose, planId }: Props) {
  const isEditing = !!planId;
  const [currentStep, setCurrentStep] = useState(0);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(defaultDraft());
  const [debouncedDuration, setDebouncedDuration] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("years");
  const [addedSubjects, setAddedSubjects] = useState<AddedSubject[]>([]);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [unahurBlocks, setUnahurBlocks] = useState<UnahurBlockDraft[]>([]);
  const [electiveBlocks, setElectiveBlocks] = useState<ElectiveBlockDraft[]>([]);
  const [creditBlocks, setCreditBlocks] = useState<CreditBlockDraft[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getInstitutes().then(setInstitutes).catch(() => setInstitutes([]));
    getCareers().then(setCareers).catch(() => setCareers([]));
    getActivities()
      .then((acts: any[]) => setAllActivities(acts.map((a: any) => ({ id: String(a.id), name: a.name }))))
      .catch(() => setAllActivities([]));
  }, []);

  useEffect(() => {
    if (!planId) return;
    let mounted = true;
    (async () => {
      try {
        const [careersData, subjectsData, corrData, planData, psData, uData, eData, cData] = await Promise.all([
          getCareers(),
          getSubjects(),
          getCorrelativities(),
          getPlan(planId),
          getPlanSubjects(planId),
          getUnahurBlocks(planId),
          getElectiveBlocks(planId),
          getCreditBlocks(planId),
        ]);
        if (!mounted) return;
        setCareers(careersData);
        const career = careersData.find((c: any) => String(c.id) === String(planData.careerId));
        setPlanDraft({
          name: planData.name ?? "",
          status: planData.status ?? "vigente",
          instituteId: String(career?.instituteId ?? ""),
          careerId: String(planData.careerId ?? ""),
          duration: Number(planData.yearsDuration ?? 1),
          minTotalCredits: planData.minTotalCredits ?? 0,
        });
        const subjectMap = new Map(subjectsData.map((s: any) => [String(s.id), s]));
        const corrMap = new Map<string, { name: string; type: string }[]>();
        for (const c of corrData ?? []) {
          const targetId = String(c.idPlanSubjectTarget);
          if (!corrMap.has(targetId)) corrMap.set(targetId, []);
          const reqSub = c.requiredPlanSubject?.Subject ?? c.requiredPlanSubject?.subject;
          if (reqSub) {
            corrMap.get(targetId)!.push({ name: reqSub.name, type: c.type ?? "regularidad" });
          }
        }
        const subjects: AddedSubject[] = (psData ?? []).map((ps: any) => {
          const sub = subjectMap.get(String(ps.idSubject));
          const psId = String(ps.id);
          return {
            code: sub?.code ?? "",
            name: sub?.name ?? "—",
            subjectEntityId: String(ps.idSubject),
            planSubjectId: psId,
            credits: ps.credits ?? 0,
            year: ps.suggestedYear ?? 1,
            semester: ps.suggestedTerm ?? 1,
            isElective: ps.is_elective ?? false,
            correlatives: corrMap.get(psId) ?? [],
          };
        });
        setAddedSubjects(subjects);
        const psIdxMap = new Map<string, number>();
        subjects.forEach((s, i) => { if (s.planSubjectId) psIdxMap.set(s.planSubjectId, i); });
        setUnahurBlocks((uData ?? []).map((u: any) => ({ suggestedYear: u.suggestedYear ?? 1, suggestedTerm: u.suggestedTerm ?? 1 })));
        setElectiveBlocks((eData ?? []).map((e: any) => ({
          name: e.name ?? "",
          minRequired: e.minRequired ?? 1,
          suggestedYear: e.suggestedYear ?? 1,
          suggestedTerm: e.suggestedTerm ?? 1,
          poolSubjectIndices: (e.subjects ?? []).map((es: any) => {
            const psId = String(es.idPlanSubject ?? es.id_plan_subject ?? "");
            return psIdxMap.get(psId) ?? 0;
          }),
        })));
        setCreditBlocks((cData ?? []).map((c: any) => ({
          name: c.name ?? "",
          minCreditsRequired: c.minCreditsRequired ?? 0,
          maxCreditsAllowed: c.maxCreditsAllowed ?? 0,
          activityIds: (c.items ?? []).map((item: any) => String(item.idActivity ?? "")),
          activityCredits: (c.items ?? []).reduce((acc: any, item: any) => {
            acc[String(item.idActivity ?? "")] = item.credits ?? 0;
            return acc;
          }, {}),
        })));
      } catch (err) {
        console.error("Failed to load plan data for editing:", err);
      }
    })();
    return () => { mounted = false; };
  }, [planId]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedDuration(planDraft.duration); }, 300);
    return () => clearTimeout(timer);
  }, [planDraft.duration]);

  const handleFieldChange = (field: keyof PlanDraft, value: any) => {
    setPlanDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectSubject = (idx: number) => {
    setEditingSubjectIdx((prev) => (prev === idx ? null : idx));
  };

  const handleAddSubject = (subject: AddedSubject) => {
    setAddedSubjects((prev) => [...prev, subject]);
    if (!subject.isElective && subject.year > 0) setExpandedYear(subject.year);
  };

  const handleUpdateSubject = (idx: number, subject: AddedSubject) => {
    setAddedSubjects((prev) => prev.map((s, i) => (i === idx ? subject : s)));
    setEditingSubjectIdx(null);
  };

  const handleClearEditing = () => { setEditingSubjectIdx(null); };

  const handleRemoveSubject = (index: number) => {
    setAddedSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectBlock = (type: "unahur" | "elective" | "credit", blockIndex: number, yearNum?: number) => {
    const key = type === "credit" ? `cb-${blockIndex}` : `${type}-${yearNum ?? 0}-${blockIndex}`;
    setEditingBlockKey((prev) => (prev === key ? null : key));
  };

  const toggleYear = (year: number) => {
    setExpandedYear((prev) => (prev === year ? null : year));
  };

  const handleAddUnahur = (block: UnahurBlockDraft) => {
    setUnahurBlocks((prev) => [...prev, block]);
    setExpandedYear(block.suggestedYear);
  };

  const handleAddElective = (block: ElectiveBlockDraft) => {
    setElectiveBlocks((prev) => [...prev, block]);
    setExpandedYear(block.suggestedYear);
  };

  const handleRemoveBlock = (type: "unahur" | "elective", index: number) => {
    if (type === "unahur") setUnahurBlocks((prev) => prev.filter((_, i) => i !== index));
    else setElectiveBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCreditBlock = (block: CreditBlockDraft) => { setCreditBlocks((prev) => [...prev, block]); };

  const electiveSubjects = useMemo(
    () => addedSubjects.map((s, idx) => ({ ...s, idx })).filter((s) => s.isElective),
    [addedSubjects]
  );

  const careerName = useMemo(
    () => careers.find((c) => String(c.id) === planDraft.careerId)?.name,
    [careers, planDraft.careerId]
  );

  const instituteName = useMemo(() => {
    const career = careers.find((c) => String(c.id) === planDraft.careerId);
    if (!career) return undefined;
    return institutes.find((i) => String(i.id) === String(career.instituteId))?.name;
  }, [institutes, careers, planDraft.careerId]);

  const instituteNameDirect = useMemo(
    () => institutes.find((i) => String(i.id) === planDraft.instituteId)?.name,
    [institutes, planDraft.instituteId]
  );

  const canAdvance = useMemo(() => {
    if (currentStep === 0) return !!(planDraft.name.trim() && planDraft.instituteId && planDraft.careerId);
    if (currentStep === 1) {
      const yearsWithSubjects = new Set(addedSubjects.filter((s) => !s.isElective).map((s) => s.year));
      return yearsWithSubjects.size >= planDraft.duration;
    }
    return true;
  }, [currentStep, planDraft, addedSubjects]);

  const stepCompletionCriteria = useMemo(() => [
    !!(planDraft.name.trim() && planDraft.instituteId && planDraft.careerId),
    new Set(addedSubjects.filter((s) => !s.isElective).map((s) => s.year)).size >= planDraft.duration,
    true, true, true,
  ], [planDraft, addedSubjects]);

  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      stepCompletionCriteria.forEach((met, i) => { if (!met && next.has(i)) next.delete(i); });
      return next;
    });
  }, [stepCompletionCriteria]);

  const [saving, setSaving] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [editingSubjectIdx, setEditingSubjectIdx] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set(planId ? [0, 1, 2, 3, 4] : []));
  const [editingBlockKey, setEditingBlockKey] = useState<string | null>(null);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const constrainHeight = useCallback(() => {
    if (window.innerWidth < 1280) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 16;
      if (available > 300) {
        containerRef.current.style.minHeight = `${available}px`;
        containerRef.current.style.maxHeight = `${available}px`;
      }
    }
  }, []);

  useEffect(() => {
    constrainHeight();
    window.addEventListener("resize", constrainHeight);
    return () => window.removeEventListener("resize", constrainHeight);
  }, [constrainHeight]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const targetPlanId = planId ?? String((await createPlan({
        careerId: planDraft.careerId, name: planDraft.name, status: planDraft.status,
        yearsDuration: planDraft.duration, minTotalCredits: planDraft.minTotalCredits,
      })).id);

      const id = String(targetPlanId);
      let tempIdCounter = 0;
      const indexToTempId: Record<number, string> = {};

      const subjects: ReplacePlanPayload["subjects"] = addedSubjects.map((s, i) => {
        const temp_id = `s_${tempIdCounter++}`;
        indexToTempId[i] = temp_id;
        let year = s.year;
        if (s.isElective) {
          const block = electiveBlocks.find((b) => b.poolSubjectIndices.includes(i));
          if (block) year = block.suggestedYear;
        }
        return {
          temp_id,
          id_subject: Number(s.subjectEntityId),
          suggested_year: year,
          suggested_term: s.semester,
          credits: s.credits,
          is_elective: s.isElective,
          is_final_project: false,
          correlative_temp_ids: [],
        };
      });

      const unahur_blocks: ReplacePlanPayload["unahur_blocks"] = unahurBlocks.map((b, i) => ({
        temp_id: `ub_${i}`,
        suggested_year: b.suggestedYear,
        suggested_term: b.suggestedTerm,
        sort_order: i,
      }));

      const elective_blocks: ReplacePlanPayload["elective_blocks"] = electiveBlocks.map((b) => ({
        name: b.name,
        min_required: b.minRequired,
        requires_approved_mandatory_count: 0,
        suggested_year: b.suggestedYear,
        sort_order: 0,
        subject_temp_ids: b.poolSubjectIndices.map((idx) => indexToTempId[idx]).filter(Boolean),
      }));

      const credit_blocks: ReplacePlanPayload["credit_blocks"] = creditBlocks.map((b) => ({
        name: b.name,
        min_credits_required: b.minCreditsRequired,
        max_credits_allowed: b.maxCreditsAllowed,
        sort_order: 0,
        activities: b.activityIds.map((aid) => ({
          id_activity: Number(aid),
          credits: b.activityCredits[aid] || 1,
        })),
      }));

      const payload: ReplacePlanPayload = {
        plan: {
          name: planDraft.name,
          status: planDraft.status,
          years_duration: planDraft.duration,
          course_type: null,
          default_term: null,
          min_total_credits: planDraft.minTotalCredits,
        },
        subjects,
        unahur_blocks,
        elective_blocks,
        credit_blocks,
      };

      await replacePlan(id, payload);
      onClose();
    } catch (err: any) {
      console.error("Error al guardar el plan", err);
      if (err.status === 409) {
        alert("No se pueden eliminar materias que tienen comisiones o registros académicos asociados.");
      } else {
        alert("Error al guardar el plan: " + (err.message || "Error desconocido"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  const handleResetStep = () => {
    if (currentStep <= 0) setPlanDraft(defaultDraft());
    if (currentStep <= 1) setAddedSubjects([]);
    if (currentStep <= 2) { setUnahurBlocks([]); setElectiveBlocks([]); }
    if (currentStep <= 3) setCreditBlocks([]);
    setConfirmResetOpen(false);
  };

  const breakdownProps = {
    planDuration: debouncedDuration, addedSubjects, unahurBlocks, electiveBlocks, creditBlocks,
    electiveSubjects, currentStep, expandedYear, toggleYear, handleRemoveSubject,
    viewMode, setViewMode, onSelectSubject: handleSelectSubject, selectedSubjectIdx: editingSubjectIdx,
    onSelectBlock: handleSelectBlock, selectedBlockKey: editingBlockKey, allActivities,
  };

  const stepShowYears = currentStep !== 3;
  const stepShowElectives = (currentStep === 1 || currentStep === 2) && electiveSubjects.length > 0;
  const stepShowActivities = currentStep === 3 || (currentStep === 4 && creditBlocks.length > 0);
  const stepShowRemove = currentStep === 1;
  const stepCollapsible = currentStep !== 0 && currentStep !== 3;
  const stepStaticMode = currentStep === 4;
  const stepViewMode = currentStep === 3 ? "activities" as const : viewMode;

  const editingCreditIndex = editingBlockKey?.startsWith("cb-")
    ? Number(editingBlockKey.split("-")[1]) : null;

  const handleUpdateCreditBlock = (index: number, block: CreditBlockDraft) => {
    setCreditBlocks((prev) => prev.map((b, i) => (i === index ? block : b)));
    setEditingBlockKey(null);
  };

  const handleDeleteCreditBlock = (index: number) => {
    setCreditBlocks((prev) => prev.filter((_, i) => i !== index));
    setEditingBlockKey(null);
  };

  return (
    <>
    <div ref={containerRef} className="flex flex-col xl:flex-1 min-h-0 space-y-6 xl:overflow-hidden">
      <StepIndicator steps={STEPS} currentStep={currentStep} completedSteps={completedSteps}
        onStepClick={(index) => { if (completedSteps.has(index) || index < currentStep) setCurrentStep(index); }} />

      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="xl:hidden flex flex-col gap-2">
            <div className="md:hidden flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => setInfoDrawerOpen(true)}>
                <span className="material-symbols-outlined text-[24px]">info</span> Plan
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => setConfirmResetOpen(true)}>
                <span className="material-symbols-outlined text-[24px]">refresh</span> Reiniciar
              </Button>
              <Button variant="secondary" onClick={() => setConfirmExitOpen(true)}>
                <span className="material-symbols-outlined text-[24px]">close</span> Salir
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0}>
              <span className="material-symbols-outlined text-[24px]">arrow_back</span> Anterior
            </Button>
            <Button variant="secondary" className="hidden md:inline-flex xl:hidden" onClick={() => setInfoDrawerOpen(true)}>
              <span className="material-symbols-outlined text-[24px]">info</span> Plan
            </Button>
            {currentStep === STEPS.length - 1 ? (
              <Button variant="primary" onClick={handleFinish} disabled={!canAdvance || saving}>
                <span className="material-symbols-outlined text-[24px]">check</span>
                {saving ? "Guardando..." : "Finalizar"}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext} disabled={!canAdvance}>
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span> Siguiente
              </Button>
            )}
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-3">
          <Button variant="secondary" onClick={() => setConfirmResetOpen(true)}>
            <span className="material-symbols-outlined text-[24px]">refresh</span> Reiniciar
          </Button>
          <Button variant="secondary" onClick={() => setConfirmExitOpen(true)}>
            <span className="material-symbols-outlined text-[24px]">close</span> Salir sin guardar
          </Button>
        </div>
        <div className="hidden xl:flex items-center gap-3">
          <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0}>
            <span className="material-symbols-outlined text-[24px]">arrow_back</span> Anterior
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button variant="primary" onClick={handleFinish} disabled={!canAdvance || saving}>
              <span className="material-symbols-outlined text-[24px]">check</span>
              {saving ? "Guardando..." : "Finalizar"}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleNext} disabled={!canAdvance}>
              <span className="material-symbols-outlined text-[24px]">arrow_forward</span> Siguiente
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={confirmExitOpen} onCancel={() => setConfirmExitOpen(false)}
        onConfirm={() => { setConfirmExitOpen(false); onClose(); }}
        title="Salir sin guardar" description="¿Estás seguro de salir? Los cambios no guardados se perderán."
        confirmLabel="Salir" cancelLabel="Cancelar" variant="warning" />

      <ConfirmDialog isOpen={confirmResetOpen} onCancel={() => setConfirmResetOpen(false)}
        onConfirm={handleResetStep} title="Reiniciar paso"
        description="Se van a borrar los datos del paso actual y los siguientes. ¿Estás seguro?"
        confirmLabel="Reiniciar" cancelLabel="Cancelar" variant="warning" />

      <div className="xl:flex-1 flex gap-3 min-h-0">
        <div className="hidden xl:block w-1/2 overflow-y-auto space-y-3">
          <Card bodyClassName="!bg-surface-container-lowest">
            <div className="flex items-start justify-between">
              <PlanInfoCard
                name={planDraft.name} status={planDraft.status}
                careerName={careerName ?? ""}
                instituteName={instituteNameDirect ?? instituteName ?? ""}
                duration={planDraft.duration}
                minTotalCredits={planDraft.minTotalCredits}
                statusVariant={statusVariant} statusLabel={statusLabel} hideBadge />
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge variant={statusVariant(planDraft.status)} label={statusLabel(planDraft.status)} />
              </div>
            </div>
          </Card>

          <PlanBreakdownSection
            {...breakdownProps}
            showYears={stepShowYears} showElectives={stepShowElectives}
            showActivities={stepShowActivities} showRemoveButtons={stepShowRemove}
            collapsible={stepCollapsible} staticMode={stepStaticMode}
            viewMode={stepViewMode} setViewMode={setViewMode} />
        </div>

        <div className="w-full xl:w-1/2 xl:overflow-y-auto">
          {currentStep === 0 && <StepInfoPlan draft={planDraft} onChange={handleFieldChange} />}
          {currentStep === 1 && (
            <StepAddSubjects planDraft={planDraft} addedSubjects={addedSubjects}
              onAddSubject={handleAddSubject} onUpdateSubject={handleUpdateSubject}
              editingSubjectIdx={editingSubjectIdx} onClearEditing={handleClearEditing}
              onDeleteSubject={handleRemoveSubject} />
          )}
          {currentStep === 2 && (
            <StepCreateBlocks planDuration={planDraft.duration}
              blockIndex={unahurBlocks.length + electiveBlocks.length}
              unahurBlocks={unahurBlocks} electiveBlocks={electiveBlocks}
              electiveSubjects={electiveSubjects.map((s) => ({ idx: s.idx, name: s.name }))}
              onAddUnahur={handleAddUnahur} onAddElective={handleAddElective}
              onRemoveBlock={handleRemoveBlock} />
          )}
          {currentStep === 3 && (
            <StepCreditBlocks planMinTotalCredits={planDraft.minTotalCredits}
              onAddCreditBlock={handleAddCreditBlock}
              editingCreditIndex={editingCreditIndex}
              editingBlock={editingCreditIndex !== null ? creditBlocks[editingCreditIndex] ?? null : null}
              onUpdateCreditBlock={handleUpdateCreditBlock}
              onDeleteCreditBlock={handleDeleteCreditBlock} />
          )}
          {currentStep === 4 && (
            <StepResume planDraft={planDraft} careerName={careerName} instituteName={instituteName}
              addedSubjects={addedSubjects} unahurBlocks={unahurBlocks}
              electiveBlocks={electiveBlocks} creditBlocks={creditBlocks}
              electiveSubjects={electiveSubjects.map((s) => ({ idx: s.idx, name: s.name }))}
              allActivities={allActivities} />
          )}
        </div>
      </div>

      </div>

      <MobileListDrawer
        isOpen={infoDrawerOpen}
        onClose={() => setInfoDrawerOpen(false)}
        title="Información del plan"
      >
        <div className="flex flex-col gap-4">
          <Card bodyClassName="!bg-surface-container-lowest !rounded-none" className="!rounded-none !border-t-0">
            <div className="flex items-start justify-between">
              <PlanInfoCard
                name={planDraft.name} status={planDraft.status}
                careerName={careerName ?? ""}
                instituteName={instituteNameDirect ?? instituteName ?? ""}
                duration={planDraft.duration}
                minTotalCredits={planDraft.minTotalCredits}
                statusVariant={statusVariant} statusLabel={statusLabel} hideBadge />
              <StatusBadge variant={statusVariant(planDraft.status)} label={statusLabel(planDraft.status)} />
            </div>
          </Card>

          <PlanBreakdownSection
            {...breakdownProps}
            showYears={stepShowYears} showElectives={stepShowElectives}
            showActivities={stepShowActivities} showRemoveButtons={stepShowRemove}
            collapsible={stepCollapsible} staticMode={stepStaticMode}
            viewMode={stepViewMode} setViewMode={setViewMode}
            cardClassName="!rounded-none" />
        </div>
      </MobileListDrawer>
    </>
  );
}
