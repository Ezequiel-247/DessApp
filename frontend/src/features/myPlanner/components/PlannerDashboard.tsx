import { useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { Dropdown } from "@/widgets/ui/Dropdown";
import { TimelinePreview } from "@/features/myPlanner/customPlan/components/TimelinePreview";
import { SavePlanModal } from "@/features/myPlanner/customPlan/components/SavePlanModal";
import { DeletePlanModal } from "@/features/myPlanner/customPlan/components/DeletePlanModal";
import type { SavedPlan, Plan } from "@/features/myPlanner/customPlan/model/planner";

interface Props {
  plans: SavedPlan[];
  activePlanId: number | null;
  previewData: Plan | null;
  onSelectPlan: (planId: number) => void;
  onEnterPlan: () => void;
  onNewProjection: () => void;
  onOpenSimulator: () => void;
  onClone: (planId: number) => void;
  enrollmentOptions?: any[];
  plansByEnrollment?: { enrollment: any; plans: SavedPlan[] }[];
  onNewPlanForEnrollment?: (enrollmentId: string) => void;
  onRenamePlan?: (planId: number, name: string) => Promise<boolean>;
  onDeletePlan?: (planId: number) => Promise<void>;
}

export function PlannerDashboard({
  plans, activePlanId, previewData,
  onSelectPlan, onEnterPlan, onNewProjection,
  onOpenSimulator, onClone,
  enrollmentOptions = [], plansByEnrollment = [], onNewPlanForEnrollment,
  onRenamePlan, onDeletePlan,
}: Props) {
  const hasMultipleCareers = enrollmentOptions.length > 1;
  const [renamingPlan, setRenamingPlan] = useState<SavedPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SavedPlan | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  const confirmRename = async (name: string) => {
    if (!renamingPlan || !onRenamePlan) return;
    setIsRenaming(true);
    const ok = await onRenamePlan(renamingPlan.id, name);
    setIsRenaming(false);
    if (ok) setRenamingPlan(null);
  };

  const confirmDelete = async () => {
    if (!deletingPlan || !onDeletePlan) return;
    setIsDeletingPlan(true);
    await onDeletePlan(deletingPlan.id);
    setIsDeletingPlan(false);
    setDeletingPlan(null);
  };

  const hasPlans = plans.length > 0;
  const selectedId = activePlanId != null ? String(activePlanId) : "";
  const activePlan = plans.find(p => p.id === activePlanId);

  return (
    <div className="flex flex-col gap-gutter pb-24 md:pb-8">
      <PageHeader
        eyebrow="Herramientas académicas"
        title="Planificador de Carrera"
        actions={hasPlans && !hasMultipleCareers ? (
          <div className="flex items-center gap-2 flex-wrap">
            <Dropdown
              icon="folder"
              label={activePlan?.name ?? "Plan actual"}
              allLabel=""
              value={selectedId}
              hideAllOption
              onChange={(v) => onSelectPlan(Number(v))}
              options={plans.map(p => ({ value: String(p.id), label: p.name }))}
              className="max-w-[140px] sm:max-w-[200px]"
            />
            <div className="w-px h-5 bg-outline-variant/50 hidden sm:block" />
            <Button variant="primary" onClick={onNewProjection} className="flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              Crear nueva
            </Button>
          </div>
        ) : undefined}
      />

      {/* MINI SECCIÓN POR CARRERA — solo si el alumno cursa más de una. Cada carrera
          muestra sus propios planes por separado (nunca mezclados): un botón para
          entrar a un plan ya guardado de ESA carrera, o para crear el primero. */}
      {hasMultipleCareers && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plansByEnrollment.map(({ enrollment, plans: careerPlans }) => (
            <Card key={enrollment.id} className="flex flex-col" bodyClassName="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                <h4 className="font-title-sm text-primary truncate">{enrollment.career?.name ?? "Sin nombre"}</h4>
              </div>
              {careerPlans.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {careerPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`flex items-center gap-1 rounded-lg border pr-1 transition-colors ${
                        plan.id === activePlanId
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectPlan(plan.id)}
                        className="flex-1 min-w-0 flex items-center justify-between px-3 py-2 text-left"
                      >
                        <span className="text-body-sm text-on-surface truncate">{plan.name}</span>
                        <span className="material-symbols-outlined text-primary/60 text-lg flex-shrink-0">chevron_right</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Renombrar plan"
                        onClick={(e) => { e.stopPropagation(); setRenamingPlan(plan); }}
                        className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar plan"
                        onClick={(e) => { e.stopPropagation(); setDeletingPlan(plan); }}
                        className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-on-surface-variant">Todavía no armaste un plan para esta carrera.</p>
              )}
              <Button
                variant="primary"
                size="sm"
                className="self-start flex items-center gap-1.5"
                onClick={() => onNewPlanForEnrollment?.(String(enrollment.id))}
              >
                <span className="material-symbols-outlined text-base">add</span>
                {careerPlans.length > 0 ? "Crear otro plan" : "Crear plan"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <Card
            className="flex-1"
            header={hasPlans ? (
              <div
                className={`flex items-center justify-between -m-5 p-5 ${previewData ? "cursor-pointer hover:bg-surface-container-low/50 transition-colors" : ""}`}
                onClick={previewData ? onEnterPlan : undefined}
              >
                <h3 className="text-headline-md font-headline-md text-primary truncate">
                  {activePlan?.name ?? "Sin plan seleccionado"}
                </h3>
                {previewData && (
                  <span className="material-symbols-outlined text-primary/60 text-xl ml-2 flex-shrink-0">
                    chevron_right
                  </span>
                )}
              </div>
            ) : undefined}
            bodyClassName="bg-surface-container-lowest px-0 py-0 flex flex-col flex-1 overflow-hidden"
          >
            {hasPlans ? (
              previewData ? (
                <div
                  className="flex-1 min-h-0 overflow-hidden p-5 cursor-pointer hover:bg-surface-container-low/50 hover:shadow-md transition-all duration-150 rounded-b-xl"
                  onClick={onEnterPlan}
                >
                  <TimelinePreview data={previewData} />
                </div>
              ) : (
                <div className="flex items-center justify-center flex-1 m-5 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                  <p className="text-on-surface-variant text-sm">Seleccioná un plan para previsualizarlo</p>
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center m-5 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-4xl">event_busy</span>
                  </div>
                  <h3 className="font-headline-md text-primary mb-2">
                    No tienes planificaciones realizadas
                  </h3>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Comienza proyectando tu trayectoria académica para optimizar tus tiempos de graduación.
                  </p>
                  <Button variant="primary" className="mx-auto flex items-center gap-2" onClick={onNewProjection}>
                    <span className="material-symbols-outlined">add</span>
                    Crear primera proyección
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="w-full sm:max-w-xs">
          <Card
            onClick={onOpenSimulator}
            className="w-full cursor-pointer hover:shadow-md hover:border-primary/30 transition-all text-left"
            bodyClassName="bg-surface p-5"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary">bolt</span>
            </div>
            <h4 className="font-title-sm text-primary mb-1">Simulador de Correlativas</h4>
            <p className="text-xs text-on-surface-variant">
              ¿Qué pasa si apruebo...? Visualizá qué materias se desbloquean.
            </p>
          </Card>
        </div>
      </div>

      <SavePlanModal
        isOpen={renamingPlan != null}
        isSaving={isRenaming}
        initialName={renamingPlan?.name ?? ""}
        title="Renombrar Plan"
        onSave={confirmRename}
        onCancel={() => setRenamingPlan(null)}
      />
      <DeletePlanModal
        isOpen={deletingPlan != null}
        isDeleting={isDeletingPlan}
        planName={deletingPlan?.name ?? ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingPlan(null)}
      />
    </div>
  );
}
