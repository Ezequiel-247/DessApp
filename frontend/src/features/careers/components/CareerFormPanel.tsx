import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { CareerFormFields } from "./CareerFormFields";
import type { CareerDraft, Institute } from "../hooks/useCareersData";

interface Props {
  selectedCareer: CareerDraft | null;
  draft: CareerDraft;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof CareerDraft, value: string | number) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  institutes: Institute[];
  dataTour?: string;
}

export function CareerFormPanel({ selectedCareer, draft, validationErrors, onFieldChange, onSave, onDelete, onNew, institutes, dataTour }: Props) {
  return (
    <Card
      data-tour={dataTour}
      className="xl:col-span-7 flex flex-col h-full"
      bodyClassName="flex-1"
      header={
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface">
            {selectedCareer ? "edit" : "add"}
          </span>
          <h2 className="font-title-sm text-title-sm text-on-surface">
            {selectedCareer ? "Editar carrera" : "Alta de carrera"}
          </h2>
        </div>
      }
      footer={
        selectedCareer ? (
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="danger" onClick={() => onDelete(selectedCareer.id)}>
                <span className="material-symbols-outlined text-[24px]">delete</span>
                Borrar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" type="submit" form="career-form">
                <span className="material-symbols-outlined text-[24px]">save</span>
                Guardar carrera
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
              <Button variant="primary" type="submit" form="career-form">
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
        id="career-form"
        className="space-y-5"
        onSubmit={(e) => { e.preventDefault(); onSave(); }}
      >
        <CareerFormFields
          draft={draft}
          validationErrors={validationErrors}
          onFieldChange={onFieldChange}
          institutes={institutes}
        />
      </form>
    </Card>
  );
}
