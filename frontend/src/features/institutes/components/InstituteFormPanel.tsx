import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { FormError } from "@/widgets/ui/FormError";
import { Form } from "@/widgets/ui/Form";
import { Input, InputSelect } from "@/widgets/ui/Input";
import type { InstituteDraft } from "../hooks/useInstitutesData";

interface Props {
  selectedRecord: InstituteDraft | null;
  draft: InstituteDraft;
  errors: Partial<Record<keyof InstituteDraft, string>>;
  onFieldChange: (field: keyof InstituteDraft, value: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function InstituteFormPanel({ selectedRecord, draft, errors, onFieldChange, onSave, onDelete, onNew }: Props) {
  return (
    <Card
      className="xl:col-span-7 flex flex-col h-full"
      bodyClassName="flex-1 overflow-y-auto"
      header={
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface">
            {selectedRecord ? "edit" : "add"}
          </span>
          <h2 className="font-title-sm text-title-sm text-on-surface">
            {selectedRecord ? "Editar instituto" : "Alta de instituto"}
          </h2>
        </div>
      }
      footer={
        selectedRecord ? (
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="danger" onClick={() => onDelete(selectedRecord.id)}>
                <span className="material-symbols-outlined text-[24px]">delete</span>
                Borrar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" type="submit" form="institute-form">
                <span className="material-symbols-outlined text-[24px]">save</span>
                Guardar instituto
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
              <Button variant="primary" type="submit" form="institute-form">
                <span className="material-symbols-outlined text-[24px]">add</span>
                Crear
              </Button>
            </div>
          </div>
        )
      }
    >
      <form
        noValidate
        id="institute-form"
        className="space-y-5"
        onSubmit={(e) => { e.preventDefault(); onSave(); }}
      >
        {Object.keys(errors).length > 0 && (
          <FormError errors={errors as Record<string, string>} />
        )}

        <Form>
          <Form.Row cols={1} className="xl:grid-cols-2">
            <Input label="Nombre del instituto" required value={draft.name} onChange={(e) => onFieldChange("name", e.target.value)} error={errors.name} placeholder="Ej. Instituto de Ciencias Exactas" />
            <Input label="Sigla" required value={draft.shortName} onChange={(e) => onFieldChange("shortName", e.target.value)} error={errors.shortName} placeholder="Ej. ICEN" />
          </Form.Row>

          <Form.Row cols={1} className="xl:grid-cols-2">
            <Input label="Responsable" required value={draft.responsible} onChange={(e) => onFieldChange("responsible", e.target.value)} error={errors.responsible} placeholder="Ej. Dra. Laura Medina" />
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Estado</span>
              <InputSelect value={draft.status} onChange={(e) => onFieldChange("status", e.target.value)}>
                <option value="activo">Activo</option>
                <option value="en_revision">En revisión</option>
                <option value="inactivo">Inactivo</option>
              </InputSelect>
            </div>
          </Form.Row>

          <Form.Row cols={1} className="xl:grid-cols-2">
            <Input label="Email institucional" required type="email" value={draft.email} onChange={(e) => onFieldChange("email", e.target.value)} error={errors.email} placeholder="contacto@instituto.edu.ar" />
            <Input label="Teléfono" required type="tel" value={draft.tel} onChange={(e) => onFieldChange("tel", e.target.value)} error={errors.tel} placeholder="Ej. +54 11 4123-9000" />
          </Form.Row>

          <Form.Row cols={1}>
            <Input label="Dirección" required value={draft.address} onChange={(e) => onFieldChange("address", e.target.value)} error={errors.address} placeholder="Ej. Av. Universidad 1500" />
          </Form.Row>

          <Form.Row cols={1}>
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Notas internas</span>
              <textarea
                rows={4}
                value={draft.notes}
                onChange={(e) => onFieldChange("notes", e.target.value)}
                className="w-full px-4 py-3 bg-surface-bright font-medium rounded border border-outline-variant text-primary text-sm placeholder:text-outline cursor-pointer transition-colors duration-300 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                placeholder="Notas de seguimiento o acuerdos internos"
              />
            </div>
          </Form.Row>
        </Form>
      </form>
    </Card>
  );
}
