import { useEffect, useMemo, useState } from "react";
import { getInstitutes } from "@/entities/Institute";
import { getCareers } from "@/entities/Career";
import { Card } from "@/widgets/ui/Card";
import { Form } from "@/widgets/ui/Form";
import { Input, InputSelect } from "@/widgets/ui/Input";

interface PlanDraft {
  name: string;
  status: string;
  instituteId: string;
  careerId: string;
  duration: number;
  minTotalCredits: number;
}

interface Props {
  draft: PlanDraft;
  onChange: (field: keyof PlanDraft, value: any) => void;
}

export function StepInfoPlan({ draft, onChange }: Props) {
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);

  useEffect(() => {
    getInstitutes().then(setInstitutes).catch(() => setInstitutes([]));
    getCareers().then(setCareers).catch(() => setCareers([]));
  }, []);

  const filteredCareers = useMemo(
    () => careers.filter((c: any) => String(c.instituteId) === draft.instituteId),
    [careers, draft.instituteId]
  );

  const handleInstituteChange = (id: string) => {
    onChange("instituteId", id);
    onChange("careerId", "");
  };

  return (
    <Card
      header={<h2 className="font-title-sm text-title-sm text-on-surface">Información del plan</h2>}
    >
        <Form>
          <Form.Row cols={1} className="xl:grid-cols-2">
            <Input label="Nombre del plan" required value={draft.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Nuevo plan" />
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Estado</span>
              <InputSelect value={draft.status} onChange={(e) => onChange("status", e.target.value)}>
                <option value="vigente">Vigente</option>
                <option value="en_transicion">En transición</option>
                <option value="discontinuado">Discontinuado</option>
              </InputSelect>
            </div>
          </Form.Row>

          <Form.Row cols={1} className="xl:grid-cols-2">
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Instituto</span>
              <InputSelect value={draft.instituteId} onChange={(e) => handleInstituteChange(e.target.value)}>
                <option value="">Seleccioná un instituto</option>
                {institutes.map((i: any) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </InputSelect>
            </div>
            <Input label="Duración (años)" required type="number" min={1} max={10} value={draft.duration} onChange={(e) => onChange("duration", Math.max(1, Math.min(10, Number(e.target.value))))} />
          </Form.Row>

          <Form.Row cols={1} className="xl:grid-cols-2">
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Carrera</span>
              <InputSelect value={draft.careerId} onChange={(e) => onChange("careerId", e.target.value)} disabled={!draft.instituteId || filteredCareers.length === 0}>
                <option value="">
                  {!draft.instituteId ? "Primero seleccioná un instituto" : filteredCareers.length === 0 ? "No hay carreras" : "Seleccioná una carrera"}
                </option>
                {filteredCareers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </InputSelect>
            </div>
            <Input label="Créditos requeridos" type="number" min={0} value={draft.minTotalCredits} onChange={(e) => onChange("minTotalCredits", Math.max(0, Number(e.target.value)))} />
          </Form.Row>
        </Form>
    </Card>
  );
}
