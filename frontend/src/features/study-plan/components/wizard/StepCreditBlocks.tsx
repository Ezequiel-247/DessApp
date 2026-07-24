import { useEffect, useMemo, useState } from "react";
import { getActivities } from "@/entities/Activity";
import type { Activity } from "@/entities/Activity";
import { Autocomplete } from "@/widgets/ui/Autocomplete";
import { Card } from "@/widgets/ui/Card";
import { Button } from "@/widgets/ui/Button";
import { Form } from "@/widgets/ui/Form";
import { Input } from "@/widgets/ui/Input";
import { Modal } from "@/widgets/ui/Modal";

export interface CreditBlockDraft {
  name: string;
  minCreditsRequired: number;
  maxCreditsAllowed: number;
  activityIds: string[];
  activityCredits: Record<string, number>;
}

interface Props {
  planMinTotalCredits: number;
  onAddCreditBlock: (block: CreditBlockDraft) => void;
  editingCreditIndex?: number | null;
  editingBlock?: CreditBlockDraft | null;
  onUpdateCreditBlock?: (index: number, block: CreditBlockDraft) => void;
  onDeleteCreditBlock?: (index: number) => void;
}

export function StepCreditBlocks({
  planMinTotalCredits,
  onAddCreditBlock,
  editingCreditIndex,
  editingBlock,
  onUpdateCreditBlock,
  onDeleteCreditBlock,
}: Props) {
  const [name, setName] = useState("");
  const [minCredits, setMinCredits] = useState(1);
  const [maxCredits, setMaxCredits] = useState(1);
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [activityCredits, setActivityCredits] = useState<Record<string, number>>({});

  const [showModal, setShowModal] = useState(false);
  const [pendingActivityId, setPendingActivityId] = useState<string | null>(null);
  const [pendingCredits, setPendingCredits] = useState(1);

  const isEditing = editingBlock !== null && editingCreditIndex !== null;

  useEffect(() => {
    getActivities().then(setAllActivities).catch(() => setAllActivities([]));
  }, []);

  useEffect(() => {
    if (editingBlock) {
      setName(editingBlock.name);
      setMinCredits(editingBlock.minCreditsRequired);
      setMaxCredits(editingBlock.maxCreditsAllowed);
      setActivityIds(editingBlock.activityIds);
      setActivityCredits(editingBlock.activityCredits || {});
    } else {
      resetForm();
    }
  }, [editingBlock]);

  const activityOptions = useMemo(
    () =>
      allActivities.map((a) => ({
        value: a.id,
        label: a.code ? `${a.code} - ${a.name}` : a.name,
        searchText: [a.code, a.name].filter(Boolean).join(" "),
      })),
    [allActivities]
  );

  const handleActivityChange = (id: string) => {
    setPendingActivityId(id || null);
  };

  const activityFound = !!pendingActivityId;
  const alreadyInBlock = pendingActivityId && activityIds.includes(pendingActivityId);

  const resetForm = () => {
    setName("");
    setMinCredits(1);
    setMaxCredits(1);
    setActivityIds([]);
    setActivityCredits({});
  };

  const resetPendingModal = () => {
    setPendingActivityId(null);
    setPendingCredits(1);
  };

  const save = () => {
    if (!name.trim()) return;
    if (activityIds.length === 0) return;
    const block: CreditBlockDraft = {
      name: name.trim(),
      minCreditsRequired: minCredits,
      maxCreditsAllowed: maxCredits,
      activityIds,
      activityCredits,
    };
    if (isEditing && editingCreditIndex !== null && onUpdateCreditBlock) {
      onUpdateCreditBlock(editingCreditIndex, block);
    } else {
      onAddCreditBlock(block);
      resetForm();
    }
  };

  const addActivity = () => {
    if (pendingActivityId && !activityIds.includes(pendingActivityId)) {
      setActivityIds((prev) => [...prev, pendingActivityId]);
      setActivityCredits((prev) => ({ ...prev, [pendingActivityId!]: pendingCredits }));
    }
    setShowModal(false);
    resetPendingModal();
  };

  const removeActivity = (id: string) => {
    setActivityIds((prev) => prev.filter((a) => a !== id));
    setActivityCredits((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
  };

  return (
    <>
      <Card
        header={
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-on-surface">
              {isEditing ? "edit" : "workspace_premium"}
            </span>
            <h3 className="font-title-sm text-title-sm text-on-surface">
              {isEditing ? "Editar bloque de créditos" : "Crear bloque de créditos"}
            </h3>
          </div>
        }
        footer={
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              {isEditing ? (
                <Button variant="danger" onClick={() => onDeleteCreditBlock?.(editingCreditIndex!)}>
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
              <Button variant="primary" onClick={save} disabled={!name.trim() || activityIds.length === 0}>
                <span className="material-symbols-outlined text-[24px]">save</span>
                {isEditing ? "Guardar cambios" : "Guardar"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <Form>
            <Form.Row cols={1}>
              <Input label="Nombre del bloque" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Bloque de Créditos I" />
            </Form.Row>
            <Form.Row cols={2}>
              <Input label="Créditos para cumplimiento" required type="number" min={0} max={planMinTotalCredits || 999}
                value={minCredits} onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setMinCredits(v); if (maxCredits < v) setMaxCredits(v); }} />
              <Input label="Créditos máximos permitidos" required type="number" min={minCredits}
                value={maxCredits} onChange={(e) => setMaxCredits(Math.max(minCredits, Number(e.target.value)))} />
            </Form.Row>
          </Form>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-caps">
                Actividades del bloque
              </span>
              <Button variant="secondary" onClick={() => setShowModal(true)}>
                <span className="material-symbols-outlined text-[24px]">add</span>
Agregar
              </Button>
            </div>

            {activityIds.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant py-1">No hay actividades en este bloque.</p>
            ) : (
              <div className="space-y-2">
                {activityIds.map((id) => {
                  const act = allActivities.find((a) => String(a.id) === id);
                  return (
                    <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-surface-container/30 border border-outline-variant">
                      <span className="text-body-sm font-medium text-on-surface">
                        {act?.name ?? "Actividad no encontrada"}
                      </span>
                      <button type="button" onClick={() => removeActivity(id)}
                        className="w-6 h-6 flex items-center justify-center text-error hover:text-error/70 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetPendingModal(); }}
        title="Agregar actividad"
        size="sm"
        footer={
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="secondary" onClick={() => { setShowModal(false); resetPendingModal(); }}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Cancelar
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <Button variant="primary" onClick={addActivity} disabled={!activityFound || pendingCredits < 1 || !!alreadyInBlock}>
                <span className="material-symbols-outlined text-[24px]">check</span>
                Agregar
              </Button>
            </div>
          </div>
        }
      >
        <Form>
          {alreadyInBlock && (
            <div className="rounded-lg bg-error-container/30 border border-error/50 p-3 text-sm text-error flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>Esta actividad ya está en el bloque.</span>
            </div>
          )}
          <Form.Row cols={1}>
            <Autocomplete
              options={activityOptions}
              value={pendingActivityId ?? ""}
              onChange={handleActivityChange}
              placeholder="Buscá por código o nombre de actividad"
              icon="search"
            />
          </Form.Row>
          <Form.Row cols={1}>
            <Input label="Créditos que otorga" required type="number" min={1} value={pendingCredits} onChange={(e) => setPendingCredits(Math.max(1, Number(e.target.value)))} />
          </Form.Row>
        </Form>
      </Modal>
    </>
  );
}
