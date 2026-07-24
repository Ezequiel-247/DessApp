import { StatusBadge } from "@/widgets/ui/StatusBadge";

interface Step {
  id: string;
  label: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (index: number) => void;
}

const STEP_ICONS: Record<string, string> = {
  info: "info",
  subjects: "playlist_add",
  blocks: "view_quilt",
  credits: "workspace_premium",
  resume: "assignment",
};

const currentIcon = (completed: boolean, stepId: string) =>
  completed ? "check" : STEP_ICONS[stepId] ?? "circle";

export function StepIndicator({ steps, currentStep, completedSteps, onStepClick }: Props) {
  return (
    <div className="flex items-start justify-center py-4">
      {/* Mobile */}
      <div className="xl:hidden flex flex-col items-center gap-2">
        <button
          type="button"
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48 }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[16px] ${
              completedSteps.has(currentStep)
                ? "bg-secondary text-on-secondary"
                : "bg-primary text-on-primary"
            } ${
              completedSteps.has(currentStep) ? "" : "outline outline-2 outline-on-surface outline-offset-4"
            }`}>
              <span className="material-symbols-outlined text-[16px]">
                {currentIcon(completedSteps.has(currentStep), steps[currentStep].id)}
              </span>
            </div>
          </div>
          <span className="font-title-sm text-title-sm text-on-surface whitespace-nowrap">
            {steps[currentStep].label}
          </span>
        </button>
        <StatusBadge
          variant={completedSteps.has(currentStep) ? "positive" : "info"}
          label={completedSteps.has(currentStep) ? "Completado" : "En progreso"}
        />
        <p className="text-body-sm text-on-surface-variant">Paso {currentStep + 1} de {steps.length}</p>
      </div>

      {/* Desktop */}
      <div className="hidden xl:flex items-start justify-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isFuture = !isCompleted && !isCurrent;

          const circleBg = isCompleted
            ? "bg-secondary text-on-secondary"
            : isCurrent
              ? "bg-primary text-on-primary"
              : "bg-slate-200 text-slate-400";

          const circleBorder = isCurrent
            ? "outline outline-2 outline-on-surface outline-offset-4"
            : "";

          const icon = isCompleted ? "check" : STEP_ICONS[step.id] ?? "circle";

          return (
            <div key={step.id} className="flex items-center">
              {index > 0 && (
                <div className="flex items-center mx-2">
                  {(() => {
                    const prevCompleted = completedSteps.has(index - 1);
                    const prevCurrent = index - 1 === currentStep;
                    if (prevCompleted) return <div className="w-16 h-1 rounded bg-secondary" />;
                    if (prevCurrent && isFuture) return <div className="w-16 h-1 rounded bg-gradient-to-r from-primary via-primary to-slate-200" />;
                    return <div className="w-16 h-1 rounded bg-slate-200" />;
                  })()}
                </div>
              )}
              <button
                type="button"
                disabled={isFuture}
                onClick={() => onStepClick(index)}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48 }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[16px] ${circleBg} ${circleBorder}`}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  </div>
                </div>
                <span className="font-title-sm text-title-sm text-on-surface whitespace-nowrap">
                  {step.label}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={isCompleted ? "positive" : isCurrent ? "info" : "neutral"}
                    label={isCompleted ? "Completado" : isCurrent ? "En progreso" : "Pendiente"}
                  />
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
