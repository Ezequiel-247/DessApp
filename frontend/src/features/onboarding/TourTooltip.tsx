import type { TooltipRenderProps } from "react-joyride";
import { Button } from "@/widgets/ui/Button";

export function TourTooltip({
  index,
  step,
  size,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      data-testid="tour-tooltip"
      className="w-[min(320px,85vw)] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-5 flex flex-col gap-3"
    >
      {step.title && (
        <h3 className="font-title-sm text-title-sm text-primary">{step.title}</h3>
      )}
      <div className="font-body-sm text-body-sm text-on-surface-variant">{step.content}</div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-on-surface-variant/70">
          {index + 1} / {size}
        </span>
        <div className="flex items-center gap-2">
          {!isLastStep && (
            <button
              {...skipProps}
              className="text-[11px] font-semibold text-on-surface-variant hover:text-on-surface px-1"
            >
              Saltar
            </button>
          )}
          {index > 0 && (
            <Button {...backProps} variant="secondary">
              Atrás
            </Button>
          )}
          <Button {...primaryProps} variant="primary">
            {isLastStep ? "Finalizar" : "Siguiente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
