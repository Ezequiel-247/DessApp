import { FormError } from "@/widgets/ui/FormError";
import { Form } from "@/widgets/ui/Form";
import { Input, InputSelect } from "@/widgets/ui/Input";
import type { CareerDraft, Institute } from "../hooks/useCareersData";

interface Props {
  draft: CareerDraft;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof CareerDraft, value: string | number) => void;
  institutes: Institute[];
}

export function CareerFormFields({ draft, validationErrors, onFieldChange, institutes }: Props) {
  return (
    <>
      {Object.keys(validationErrors).length > 0 && (
        <FormError errors={validationErrors} />
      )}

      <Form>
        <Form.Row cols={1} className="xl:grid-cols-2">
          <Input label="Código interno" value={draft.code} onChange={(e) => onFieldChange("code", e.target.value)} placeholder="Ej. LIS" />
          <Input label="Nombre de la carrera" required value={draft.name} onChange={(e) => onFieldChange("name", e.target.value)} error={validationErrors.name} placeholder="Ej. Licenciatura en Sistemas" />
        </Form.Row>

        <Form.Row cols={1} className="xl:grid-cols-2">
          <Input label="Título que otorga" required value={draft.degreeTitle} onChange={(e) => onFieldChange("degreeTitle", e.target.value)} error={validationErrors.degreeTitle} placeholder="Ej. Licenciado en Sistemas" />
          <div className="flex flex-col gap-xs">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Instituto<span className="text-error ml-0.5">*</span>
            </span>
            <InputSelect value={draft.instituteId} onChange={(e) => onFieldChange("instituteId", e.target.value)} error={!!validationErrors.instituteId}>
              {institutes.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </InputSelect>
            {validationErrors.instituteId && <span className="text-sm text-error">{validationErrors.instituteId}</span>}
          </div>
        </Form.Row>

        <Form.Row cols={1} className="xl:grid-cols-[1fr_2fr]">
          <Input label="Duración estimada" required type="number" min={1} max="8" value={draft.duration} onChange={(e) => onFieldChange("duration", e.target.value)} error={validationErrors.duration} />
          <div className="flex flex-col gap-xs">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Descripción breve</span>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              className="w-full px-4 py-3 bg-surface-bright font-medium rounded border border-outline-variant text-primary text-sm placeholder:text-outline cursor-pointer transition-colors duration-300 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Breve descripción de la carrera"
            />
          </div>
        </Form.Row>
      </Form>
    </>
  );
}
