import { useState } from "react";
import { Card } from "@/widgets/ui/Card";
import { Button } from "@/widgets/ui/Button";
import { Form } from "@/widgets/ui/Form";
import { Input, InputSelect } from "@/widgets/ui/Input";
import { Modal } from "@/widgets/ui/Modal";

export interface UnahurBlockDraft {
  suggestedYear: number;
  suggestedTerm: number;
}

export interface ElectiveBlockDraft {
  name: string;
  minRequired: number;
  suggestedYear: number;
  suggestedTerm: number;
  poolSubjectIndices: number[];
}

interface PoolSubject {
  idx: number;
  name: string;
}

interface Props {
  planDuration: number;
  blockIndex: number;
  unahurBlocks: UnahurBlockDraft[];
  electiveBlocks: ElectiveBlockDraft[];
  electiveSubjects: PoolSubject[];
  onAddUnahur: (block: UnahurBlockDraft) => void;
  onAddElective: (block: ElectiveBlockDraft) => void;
  onRemoveBlock: (type: "unahur" | "elective", index: number) => void;
}

export function StepCreateBlocks({
  planDuration,
  blockIndex,
  unahurBlocks,
  electiveBlocks,
  electiveSubjects,
  onAddUnahur,
  onAddElective,
  onRemoveBlock,
}: Props) {
  const [mode, setMode] = useState<"selector" | "unahur" | "elective">("selector");

  const [uYear, setUYear] = useState(1);
  const [uTerm, setUTerm] = useState(1);

  const [eYear, setEYear] = useState(1);
  const [eTerm, setETerm] = useState(1);
  const [poolIndices, setPoolIndices] = useState<number[]>([]);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [selectedPoolIdx, setSelectedPoolIdx] = useState<number | null>(null);

  const resetUnahur = () => { setUYear(1); setUTerm(1); };
  const resetElective = () => { setEYear(1); setETerm(1); setPoolIndices([]); };

  const handleAddUnahur = () => {
    onAddUnahur({ suggestedYear: uYear, suggestedTerm: uTerm });
    resetUnahur();
    setMode("selector");
  };

  const handleAddElective = () => {
    const name = `Bloque Electivo ${electiveBlocks.length + 1}`;
    onAddElective({ name, minRequired: 1, suggestedYear: eYear, suggestedTerm: eTerm, poolSubjectIndices: poolIndices });
    resetElective();
    setMode("selector");
  };

  const handleAddPoolSubject = () => {
    if (selectedPoolIdx !== null && !poolIndices.includes(selectedPoolIdx)) {
      setPoolIndices((prev) => [...prev, selectedPoolIdx]);
    }
    setShowPoolModal(false);
    setSelectedPoolIdx(null);
  };

  const handleRemovePoolSubject = (idx: number) => {
    setPoolIndices((prev) => prev.filter((i) => i !== idx));
  };

  const availablePoolSubjects = electiveSubjects.filter((s) => !poolIndices.includes(s.idx));
  const isFormMode = mode !== "selector";

  const headerIcon = mode === "unahur" ? "school" : mode === "elective" ? "playlist_add_check" : "add";
  const headerTitle = mode === "selector" ? "Seleccionar tipo de bloque"
    : mode === "unahur" ? "Crear bloque UNAHUR"
    : "Crear bloque de electivas";

  if (mode === "selector") {
    return (
      <Card
        header={
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-on-surface">{headerIcon}</span>
            <h3 className="font-title-sm text-title-sm text-on-surface">{headerTitle}</h3>
          </div>
        }
      >
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => { resetElective(); setMode("elective"); }}
            className="w-full flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-3xl text-primary">playlist_add_check</span>
            <div className="text-center">
              <span className="block font-title-sm text-title-sm text-on-surface">Crear bloque de electivas</span>
              <span className="block text-body-sm text-on-surface-variant mt-1">
                Agrupa materias electivas en un bloque con año y cuatrimestre sugerido.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { resetUnahur(); setMode("unahur"); }}
            className="w-full flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-3xl text-primary">school</span>
            <div className="text-center">
              <span className="block font-title-sm text-title-sm text-on-surface">Crear bloque de materias UNAHUR</span>
              <span className="block text-body-sm text-on-surface-variant mt-1">
                Define un bloque de materia UNAHUR con año y cuatrimestre recomendado.
              </span>
            </div>
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        header={
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-on-surface">{headerIcon}</span>
            <h3 className="font-title-sm text-title-sm text-on-surface">{headerTitle}</h3>
          </div>
        }
        footer={
          <div className="flex flex-col-reverse gap-3 xl:flex-row">
            <div className="flex-1 flex flex-col">
              <Button variant="secondary" onClick={() => setMode("selector")}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Cancelar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="secondary" onClick={mode === "unahur" ? resetUnahur : resetElective}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Limpiar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" onClick={mode === "unahur" ? handleAddUnahur : handleAddElective}
                disabled={mode === "elective" && poolIndices.length === 0}>
                <span className="material-symbols-outlined text-[24px]">check</span>
                Agregar
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <Form>
          <Form.Row cols={1} className="xl:grid-cols-2">
            <Input label="Año recomendado" required type="number" min={1} max={planDuration}
                value={mode === "unahur" ? uYear : eYear}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(planDuration, Number(e.target.value)));
                  mode === "unahur" ? setUYear(val) : setEYear(val);
                }} />
              <div className="flex flex-col gap-xs">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Cuatrimestre recomendado</span>
                <InputSelect value={mode === "unahur" ? uTerm : eTerm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    mode === "unahur" ? setUTerm(val) : setETerm(val);
                  }}>
                  <option value={1}>Primero</option>
                  <option value={2}>Segundo</option>
                </InputSelect>
              </div>
            </Form.Row>
          </Form>

          {mode === "elective" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-caps">
                  Materias del bloque
                </span>
                <Button variant="secondary" onClick={() => setShowPoolModal(true)}
                  disabled={availablePoolSubjects.length === 0}>
                  <span className="material-symbols-outlined text-[24px]">add</span>
                  Agregar
                </Button>
              </div>

              {poolIndices.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant py-1">No hay materias en este bloque.</p>
              ) : (
                <div className="space-y-2">
                  {poolIndices.map((idx, i) => {
                    const sub = electiveSubjects.find((es) => es.idx === idx);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-container/30 border border-outline-variant">
                        <span className="text-body-sm font-medium text-on-surface">
                          {sub?.name ?? "Materia no encontrada"}
                        </span>
                        <button type="button" onClick={() => handleRemovePoolSubject(idx)}
                          className="w-6 h-6 flex items-center justify-center text-error hover:text-error/70 transition-colors">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showPoolModal}
        onClose={() => setShowPoolModal(false)}
        title="Agregar materia electiva"
        size="sm"
        footer={
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="secondary" onClick={() => setShowPoolModal(false)}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Cancelar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" onClick={handleAddPoolSubject} disabled={selectedPoolIdx === null}>
                <span className="material-symbols-outlined text-[24px]">check</span>
                Agregar
              </Button>
            </div>
          </div>
        }
      >
        <Form>
          <div className="flex flex-col gap-xs">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Materia</span>
            <InputSelect value={selectedPoolIdx ?? ""} onChange={(e) => setSelectedPoolIdx(Number(e.target.value))}>
              <option value="">Seleccioná una materia</option>
              {availablePoolSubjects.map((s) => (
                <option key={s.idx} value={s.idx}>{s.name}</option>
              ))}
            </InputSelect>
          </div>
        </Form>
      </Modal>
    </>
  );
}
