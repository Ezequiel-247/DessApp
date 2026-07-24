import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";

interface AffectedSubject {
  subject_name: string;
  suggested_year: number;
  suggested_term: number;
}

interface Props {
  subjectName: string;
  targetLabel: string;
  affectedSubjects: AffectedSubject[];
  onContinue: () => void;
  onCancel: () => void;
}

function termLabel(term: number): string {
  return term === 1 ? "1° Cuatrimestre" : "2° Cuatrimestre";
}

export function CascadingImpactModal({ subjectName, targetLabel, affectedSubjects, onContinue, onCancel }: Props) {
  return (
    <Modal isOpen onClose={onCancel} title="Materias afectadas" size="sm">
      <p className="text-sm text-on-surface-variant mb-4">
        Si retrasás <strong className="text-on-surface">{subjectName}</strong> a {targetLabel}, las siguientes materias se verán afectadas:
      </p>

      <div className="space-y-2 mb-6">
        {affectedSubjects.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-warning-container/10 border border-warning-container/30 rounded-xl"
          >
            <span className="material-symbols-outlined text-warning text-sm">warning</span>
            <div>
              <p className="font-semibold text-sm text-on-surface">{s.subject_name}</p>
              <p className="text-xs text-on-surface-variant">
                {s.suggested_year}° Año, {termLabel(s.suggested_term)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" className="flex-1" onClick={onContinue}>
          Continuar de todas formas
        </Button>
      </div>
    </Modal>
  );
}
