import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { FormError } from "@/widgets/ui/FormError";
import { Form } from "@/widgets/ui/Form";
import { Input } from "@/widgets/ui/Input";
import type { ActivityDraft } from "../hooks/useActivitiesData";
import type { Activity } from "@/entities/Activity";

interface Props {
  selectedActivity: Activity | null;
  draft: ActivityDraft;
  saving: boolean;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof ActivityDraft, value: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function ActivityFormPanel({ selectedActivity, draft, saving, validationErrors, onFieldChange, onSave, onDelete, onNew }: Props) {
  return (
    <Card
      className="xl:col-span-7 flex flex-col h-full"
      bodyClassName="flex-1"
      header={
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface">
            {selectedActivity ? "edit" : "add"}
          </span>
          <h2 className="font-title-sm text-title-sm text-on-surface">
            {selectedActivity ? "Editar actividad" : "Alta de actividad"}
          </h2>
        </div>
      }
      footer={
        selectedActivity ? (
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="danger" onClick={() => onDelete(selectedActivity.id)}>
                <span className="material-symbols-outlined text-[24px]">delete</span>
                Borrar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" type="submit" form="activity-form" disabled={saving}>
                <span className="material-symbols-outlined text-[24px]">save</span>
                {saving ? "Guardando..." : "Guardar actividad"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="secondary" onClick={onNew}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Limpiar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" type="submit" form="activity-form" disabled={saving || !draft.name.trim()}>
                <span className="material-symbols-outlined text-[24px]">add</span>
                {saving ? "Guardando..." : "Crear"}
              </Button>
            </div>
          </div>
        )
      }
    >
      <form
        noValidate
        id="activity-form"
        className="space-y-5"
        onSubmit={(e) => { e.preventDefault(); onSave(); }}
      >
        {Object.keys(validationErrors).length > 0 && (
          <FormError errors={validationErrors} />
        )}

        <Form>
          <Form.Row cols={1} className="xl:grid-cols-2">
            <Input label="Código" required value={draft.code} onChange={(e) => onFieldChange("code", e.target.value)} error={validationErrors.code} placeholder="Ej. ACT-001" maxLength={20} />
            <Input label="Nombre" required value={draft.name} onChange={(e) => onFieldChange("name", e.target.value)} error={validationErrors.name} placeholder="Ej. Taller de investigación" maxLength={150} />
          </Form.Row>
          <Form.Row cols={1}>
            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Descripción</label>
              <textarea
                value={draft.description}
                onChange={(e) => onFieldChange("description", e.target.value)}
                placeholder="Descripción opcional"
                rows={3}
                className="w-full px-4 py-3 bg-surface-bright font-medium rounded border border-outline-variant text-primary text-sm placeholder:text-outline cursor-pointer transition-colors duration-300 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </Form.Row>
        </Form>
      </form>
    </Card>
  );
}
