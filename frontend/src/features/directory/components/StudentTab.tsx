import { Form } from "@/widgets/ui/Form";
import { Input } from "@/widgets/ui/Input";
import { Button } from "@/widgets/ui/Button";
import type { UnifiedDraft } from "../hooks/useUserForm";
import type { Career } from "@/entities/Career/model/career";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("es-AR");
  } catch {
    return dateStr;
  }
}

interface Props {
  draft: UnifiedDraft;
  plans: any[];
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof UnifiedDraft, value: any) => void;
  careersOptions: Career[];
  onOpenEnrollmentModal: (state: { open: boolean; enrollment: any | null }) => void;
  onAddFullEnrollment: (careerId: number, studyPlanId: number | null, enrolledAt: string) => void;
  onRemoveEnrollment: (tempId: number) => void;
}

export function StudentTab({ draft, plans, validationErrors, onFieldChange, careersOptions, onOpenEnrollmentModal, onAddFullEnrollment, onRemoveEnrollment }: Props) {
  return (
    <div className="space-y-5">
      <Form>
        <Form.Row cols={2}>
          <Input label="Legajo" required value={draft.legajo} onChange={(e) => onFieldChange("legajo", e.target.value)} error={validationErrors.legajo} placeholder="Ej. A12345" />
        </Form.Row>
      </Form>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Inscripciones a carreras
          </span>
          <Button variant="primary" onClick={() => onOpenEnrollmentModal({ open: true, enrollment: null })}>
            <span className="material-symbols-outlined text-[24px]">add</span>
          </Button>
        </div>

        <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
          {draft.enrollments.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">Sin inscripciones.</p>
          ) : (
            draft.enrollments.map((enr) => {
              const career = careersOptions.find((c) => Number(c.id) === enr.careerId);
              const plan = plans.find((p) => String(p.id) === String(enr.studyPlanId));
              return (
                <div key={enr.tempId} className="rounded-xl border border-outline-variant bg-white p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">school</span>
                    <span className="font-title-sm text-title-sm text-on-surface truncate">{career?.name ?? "Carrera no encontrada"}</span>
                    <button
                      type="button"
                      onClick={() => onOpenEnrollmentModal({ open: true, enrollment: enr })}
                      className="text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveEnrollment(enr.tempId)}
                      className="ml-auto text-error hover:text-error/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                    <div>
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Plan</span>
                      <p className="text-on-surface">{plan ? `${plan.name} (${plan.status})` : "Sin plan"}</p>
                    </div>
                    <div>
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Inicio</span>
                      <p className="text-on-surface">{formatDate(enr.enrolledAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
