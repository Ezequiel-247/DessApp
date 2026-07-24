import { useEffect, useMemo, useState } from "react";
import { getSubjects } from "@/entities/Subject";
import type { Subject } from "@/entities/Subject";
import { Autocomplete } from "@/widgets/ui/Autocomplete";
import { Card } from "@/widgets/ui/Card";
import { Button } from "@/widgets/ui/Button";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { Form } from "@/widgets/ui/Form";
import { Input, InputSelect } from "@/widgets/ui/Input";
import { InputToggle } from "@/widgets/ui/InputToggle";
import { FormError } from "@/widgets/ui/FormError";
import { Modal } from "@/widgets/ui/Modal";
import type { PlanDraft } from "../PlanCreationWizard";

export interface AddedSubject {
  code: string;
  name: string;
  subjectEntityId: string;
  planSubjectId?: string;
  credits: number;
  year: number;
  semester: number;
  isElective: boolean;
  correlatives: { name: string; type: string }[];
}

interface Props {
  planDraft: PlanDraft;
  addedSubjects: AddedSubject[];
  onAddSubject: (s: AddedSubject) => void;
  onUpdateSubject: (idx: number, s: AddedSubject) => void;
  editingSubjectIdx: number | null;
  onClearEditing: () => void;
  onDeleteSubject: (idx: number) => void;
}

export function StepAddSubjects({
  planDraft,
  addedSubjects,
  onAddSubject,
  onUpdateSubject,
  editingSubjectIdx,
  onClearEditing,
  onDeleteSubject,
}: Props) {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState(0);
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [isElective, setIsElective] = useState(false);
  const [foundSubjectId, setFoundSubjectId] = useState<string | null>(null);
  const [correlatives, setCorrelatives] = useState<{ name: string; type: string }[]>([]);
  const [showCorrModal, setShowCorrModal] = useState(false);
  const [corrCandidateId, setCorrCandidateId] = useState("");
  const [corrFilterYear, setCorrFilterYear] = useState(1);
  const [corrType, setCorrType] = useState("regularidad");
  const [corrError, setCorrError] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const isEditing = editingSubjectIdx !== null;

  const currentSubjectYear = isEditing
    ? (addedSubjects[editingSubjectIdx!]?.year ?? 1)
    : year;

  const currentSubjectId = isEditing
    ? (addedSubjects[editingSubjectIdx!]?.subjectEntityId ?? null)
    : foundSubjectId;

  useEffect(() => {
    getSubjects().then(setAllSubjects).catch(() => setAllSubjects([]));
  }, []);

  useEffect(() => {
    if (editingSubjectIdx !== null) {
      const s = addedSubjects[editingSubjectIdx];
      if (s) {
        setCode(s.code);
        setName(s.name);
        setCredits(s.credits);
        setYear(s.year || 1);
        setSemester(s.semester || 1);
        setIsElective(s.isElective);
        setFoundSubjectId(s.subjectEntityId);
        setCorrelatives(s.correlatives);
        setSaveErrors({});
      }
    } else {
      resetForm();
    }
  }, [editingSubjectIdx]);

  const subjectOptions = useMemo(
    () =>
      allSubjects.map((s) => ({
        value: s.id,
        label: `${s.code} - ${s.name}`,
        searchText: `${s.code} ${s.name}`,
      })),
    [allSubjects]
  );

  const handleSubjectChange = (subjectId: string) => {
    if (subjectId) {
      const subject = allSubjects.find((s) => s.id === subjectId);
      if (subject) {
        setCode(subject.code);
        setName(subject.name);
        setFoundSubjectId(subject.id);
      }
    } else {
      setCode("");
      setName("");
      setFoundSubjectId(null);
    }
  };

  const found = !!foundSubjectId;
  const inputsDisabled = !found && !isEditing;

  const alreadyInPlan = !isEditing && foundSubjectId && addedSubjects.some(
    (s) => s.subjectEntityId === foundSubjectId
  );

  const yearOptions = useMemo(
    () => Array.from({ length: planDraft.duration }, (_, i) => i + 1),
    [planDraft.duration]
  );

  const filteredCorrSubjects = useMemo(
    () => addedSubjects.filter((s) => !s.isElective && s.year > 0 && s.year === corrFilterYear),
    [addedSubjects, corrFilterYear]
  );

  const resetForm = () => {
    setCode("");
    setName("");
    setCredits(0);
    setYear(1);
    setSemester(1);
    setIsElective(false);
    setFoundSubjectId(null);
    setCorrelatives([]);
    setSaveErrors({});
    onClearEditing();
  };

  // Build adjacency list from all addedSubjects for cycle detection.
  // Uses live correlatives state for the currently-editing subject.
  const buildGraph = (extraEdge?: { from: string; to: string }) => {
    const adj = new Map<string, string[]>();
    for (const s of addedSubjects) {
      const from = s.subjectEntityId;
      if (!adj.has(from)) adj.set(from, []);
      const corrs = isEditing && from === currentSubjectId
        ? correlatives
        : s.correlatives;
      for (const c of corrs) {
        const target = addedSubjects.find((as) => as.name === c.name);
        if (target) {
          adj.get(from)!.push(target.subjectEntityId);
        }
      }
    }
    if (extraEdge) {
      if (!adj.has(extraEdge.from)) adj.set(extraEdge.from, []);
      adj.get(extraEdge.from)!.push(extraEdge.to);
    }
    return adj;
  };

  const hasCycle = (fromId: string, toId: string): boolean => {
    const adj = buildGraph({ from: fromId, to: toId });
    const visited = new Set<string>();
    const dfs = (node: string): boolean => {
      if (node === fromId && visited.size > 0) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      for (const neighbor of adj.get(node) ?? []) {
        if (dfs(neighbor)) return true;
      }
      return false;
    };
    return dfs(toId);
  };

  const isTransitiveRedundant = (fromId: string, toId: string): boolean => {
    const adj = buildGraph();
    const visited = new Set<string>();
    const dfs = (node: string): boolean => {
      if (node === toId) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      for (const neighbor of adj.get(node) ?? []) {
        if (dfs(neighbor)) return true;
      }
      return false;
    };
    return dfs(fromId);
  };

  const getSubjectName = (id: string) => addedSubjects.find((s) => s.subjectEntityId === id)?.name ?? "";

  const getSubjectYear = (id: string) => addedSubjects.find((s) => s.subjectEntityId === id)?.year ?? 0;

  const validateCorrelative = (candidateId: string, candidateName: string): string | null => {
    if (!currentSubjectId) return "Primero seleccioná o guardá la materia actual.";

    if (candidateId === currentSubjectId) return "Una materia no puede ser correlativa de sí misma.";

    const alreadyExists = correlatives.some((c) => c.name === candidateName);
    if (alreadyExists) return "Esta materia ya está cargada como correlativa.";

    const candidateYear = getSubjectYear(candidateId);
    if (candidateYear > 0 && currentSubjectYear > 0 && candidateYear > currentSubjectYear) {
      return `No puede tener como correlativa una materia de ${candidateYear}° año (la actual está en ${currentSubjectYear}°).`;
    }

    if (hasCycle(currentSubjectId, candidateId)) {
      return "Agregar esta correlativa generaría un ciclo. Revisá las dependencias.";
    }

    if (isTransitiveRedundant(currentSubjectId, candidateId)) {
      return "Esta materia ya es correlativa de forma transitiva a través de otras materias.";
    }

    return null;
  };

  const handleAddCorrelative = () => {
    setCorrError(null);
    const candidate = addedSubjects.find((s) => s.subjectEntityId === corrCandidateId);
    if (!candidate) return;

    const error = validateCorrelative(candidate.subjectEntityId, candidate.name);
    if (error) {
      setCorrError(error);
      return;
    }

    setCorrelatives((prev) => [...prev, { name: candidate.name, type: corrType }]);
    setShowCorrModal(false);
    setCorrCandidateId("");
    setCorrFilterYear(1);
    setCorrType("regularidad");
    setCorrError(null);
  };

  const save = () => {
    if ((!foundSubjectId || !name) && !isEditing) return;

    // Validate overall correlatives consistency before saving
    const errors: Record<string, string> = {};
    const seen = new Set<string>();
    for (const c of correlatives) {
      if (seen.has(c.name)) {
        errors.correlatives = `La correlativa "${c.name}" está duplicada.`;
        break;
      }
      seen.add(c.name);
    }
    if (!errors.correlatives && currentSubjectId) {
      const adj = buildGraph();
      if (adj.has(currentSubjectId)) {
        const visited = new Set<string>();
        const dfs = (node: string): boolean => {
          if (node === currentSubjectId && visited.size > 0) return true;
          if (visited.has(node)) return false;
          visited.add(node);
          for (const neighbor of adj.get(node) ?? []) {
            if (dfs(neighbor)) return true;
          }
          return false;
        };
        for (const neighbor of adj.get(currentSubjectId) ?? []) {
          if (dfs(neighbor)) {
            errors.correlatives = "Las correlativas generan un ciclo. Revisá las dependencias.";
            break;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setSaveErrors(errors);
      return;
    }

    const data: AddedSubject = {
      code,
      name,
      subjectEntityId: foundSubjectId || "",
      credits,
      year: isElective ? 0 : year,
      semester: isElective ? 0 : semester,
      isElective,
      correlatives,
    };
    if (isEditing && editingSubjectIdx !== null) {
      onUpdateSubject(editingSubjectIdx, data);
    } else {
      onAddSubject(data);
    }
    resetForm();
  };

  return (
    <>
      <Card
        header={
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-on-surface">
              {isEditing ? "edit" : "add"}
            </span>
            <h3 className="font-title-sm text-title-sm text-on-surface">
              {isEditing ? "Editar materia" : "Agregar materia"}
            </h3>
          </div>
        }
        footer={
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              {isEditing ? (
                <Button variant="danger" onClick={() => editingSubjectIdx !== null && setDeleteConfirm(editingSubjectIdx)}>
                  <span className="material-symbols-outlined text-[24px]">delete</span>
                  Eliminar
                </Button>
              ) : (
                <Button variant="secondary" onClick={resetForm}>
                  <span className="material-symbols-outlined text-[24px]">close</span>
                  Limpiar
                </Button>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" onClick={save} disabled={!isEditing && (!found || !!alreadyInPlan)}>
                <span className="material-symbols-outlined text-[24px]">save</span>
                Guardar
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {alreadyInPlan && (
            <div className="rounded-lg bg-error-container/30 border border-error/50 p-3 text-sm text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>Esta materia ya está agregada al plan.</span>
            </div>
          )}

          <Form>
            <Form.Row cols={1}>
              <Autocomplete
                options={subjectOptions}
                value={foundSubjectId ?? ""}
                onChange={handleSubjectChange}
                placeholder="Buscá por código o nombre de materia"
                icon="search"
              />
            </Form.Row>

            <Form.Row cols={1} className="xl:grid-cols-3">
              <Input label="Créditos" type="number" min={0} max={planDraft.minTotalCredits || 999} value={credits} onChange={(e) => setCredits(Math.max(0, Number(e.target.value)))} disabled={inputsDisabled && !isEditing} />
              <Input label="Año" type="number" min={1} max={planDraft.duration} value={isElective ? 0 : year} onChange={(e) => setYear(Math.max(1, Math.min(planDraft.duration, Number(e.target.value))))} disabled={(inputsDisabled && !isEditing) || isElective} />
              <div className="flex flex-col gap-xs">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Cuatrimestre</span>
                <InputSelect value={isElective ? 0 : semester} onChange={(e) => setSemester(Number(e.target.value))} disabled={(inputsDisabled && !isEditing) || isElective}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </InputSelect>
              </div>
            </Form.Row>

            <Form.Row cols={2}>
              <InputToggle
                label="Es electiva"
                checked={isElective}
                onChange={setIsElective}
              />
            </Form.Row>
          </Form>

          {Object.keys(saveErrors).length > 0 && (
            <FormError errors={saveErrors} />
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-caps">
                Correlativas
              </span>
              <Button variant="secondary" onClick={() => setShowCorrModal(true)} disabled={(inputsDisabled && !isEditing) || addedSubjects.length === 0}>
                <span className="material-symbols-outlined text-[24px]">add</span>
                Agregar
              </Button>
            </div>
            {correlatives.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant py-1">
                No tiene correlativas cargadas.
              </p>
            ) : (
              <div className="space-y-2">
                {correlatives.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-container/30 border border-outline-variant">
                    <span className="text-body-sm font-medium text-on-surface">
                      {c.name} <span className="text-on-surface-variant font-normal">({c.type})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCorrelatives((prev) => prev.filter((_, j) => j !== i))}
                      className="w-6 h-6 flex items-center justify-center text-error hover:text-error/70 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showCorrModal}
        onClose={() => { setShowCorrModal(false); setCorrError(null); setCorrFilterYear(1); }}
        title="Agregar correlativa"
        size="md"
        footer={
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="secondary" onClick={() => { setShowCorrModal(false); setCorrError(null); setCorrFilterYear(1); }}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Cancelar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" onClick={handleAddCorrelative} disabled={!corrCandidateId || !!corrError}>
                <span className="material-symbols-outlined text-[24px]">check</span>
                Agregar
              </Button>
            </div>
          </div>
        }
      >
        <Form>
          {corrError && (
            <div className="rounded-lg bg-error-container/30 border border-error/50 p-3 text-sm text-error flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{corrError}</span>
            </div>
          )}
          <Form.Row cols={1} className="xl:grid-cols-2">
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Año</span>
              <InputSelect value={corrFilterYear} onChange={(e) => { setCorrFilterYear(Number(e.target.value)); setCorrCandidateId(""); }} disabled={yearOptions.length <= 1}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}° año</option>
                ))}
              </InputSelect>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Materia</span>
              <InputSelect value={corrCandidateId} onChange={(e) => { setCorrCandidateId(e.target.value); setCorrError(null); }} disabled={filteredCorrSubjects.length === 0}>
                <option value="">{filteredCorrSubjects.length === 0 ? "Sin materias" : "Seleccioná una materia"}</option>
                {filteredCorrSubjects.map((s) => (
                  <option key={s.subjectEntityId} value={s.subjectEntityId}>{s.name}</option>
                ))}
              </InputSelect>
            </div>
          </Form.Row>
          <Form.Row cols={1}>
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tipo</span>
              <InputSelect value={corrType} onChange={(e) => setCorrType(e.target.value)}>
                <option value="regularidad">Regularidad</option>
                <option value="finalizada">Finalizada</option>
              </InputSelect>
            </div>
          </Form.Row>
        </Form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm !== null) onDeleteSubject(deleteConfirm);
          setDeleteConfirm(null);
          resetForm();
        }}
        title="Eliminar materia"
        description="¿Estás seguro de eliminar esta materia del plan?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </>
  );
}
