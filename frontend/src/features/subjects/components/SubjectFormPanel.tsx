import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { FormError } from "@/widgets/ui/FormError";
import { Form } from "@/widgets/ui/Form";
import { Input } from "@/widgets/ui/Input";
import { InputToggle } from "@/widgets/ui/InputToggle";
import type { SubjectDraft } from "../hooks/useSubjectsData";
import type { Subject } from "@/entities/Subject";

interface Props {
  selectedSubject: Subject | null;
  draft: SubjectDraft;
  saving: boolean;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof SubjectDraft, value: string | number | boolean) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function SubjectFormPanel({ selectedSubject, draft, saving, validationErrors, onFieldChange, onSave, onDelete, onNew }: Props) {
  return (
    <Card
      className="xl:col-span-7 flex flex-col h-full"
      bodyClassName="flex-1"
      header={
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface">
            {selectedSubject ? "edit" : "add"}
          </span>
          <h2 className="font-title-sm text-title-sm text-on-surface">
            {selectedSubject ? "Editar materia" : "Alta de materia"}
          </h2>
        </div>
      }
      footer={
        selectedSubject ? (
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="danger" onClick={() => onDelete(selectedSubject.id)}>
                <span className="material-symbols-outlined text-[24px]">delete</span>
                Borrar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" type="submit" form="subject-form" disabled={saving}>
                <span className="material-symbols-outlined text-[24px]">save</span>
                {saving ? "Guardando..." : "Guardar materia"}
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
              <Button variant="primary" type="submit" form="subject-form" disabled={saving || !draft.code.trim()}>
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
        id="subject-form"
        className="space-y-5"
        onSubmit={(e) => { e.preventDefault(); onSave(); }}
      >
        {Object.keys(validationErrors).length > 0 && (
          <FormError errors={validationErrors} />
        )}

        <Form>
          <Form.Row cols={1} className="xl:grid-cols-2">
            <Input label="Código" required value={draft.code} onChange={(e) => onFieldChange("code", e.target.value)} error={validationErrors.code} placeholder="MAT101" maxLength={10} />
            <Input label="Nombre" required value={draft.name} onChange={(e) => onFieldChange("name", e.target.value)} error={validationErrors.name} placeholder="Ej. Análisis Matemático I" maxLength={150} />
          </Form.Row>

          <Form.Row cols={2}>
            <Input label="Horas semanales" required type="number" min={1} max={12} value={draft.weeklyHours} onChange={(e) => onFieldChange("weeklyHours", e.target.value ? Number(e.target.value) : 4)} error={validationErrors.weeklyHours} />
            <InputToggle
              label="Materia UNAHUR"
              checked={draft.is_unahur}
              onChange={(checked: boolean) => onFieldChange("is_unahur", checked)}
            />
          </Form.Row>
        </Form>
      </form>
    </Card>
  );
}
