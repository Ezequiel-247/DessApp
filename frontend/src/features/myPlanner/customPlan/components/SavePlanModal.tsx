import { useState, useEffect } from "react";
import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";
import { Input } from "@/widgets/ui/Input";
import { Form } from "@/widgets/ui/Form";

interface Props {
  isOpen: boolean;
  isSaving: boolean;
  initialName?: string;
  title?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function SavePlanModal({ isOpen, isSaving, initialName = "", title = "Guardar Plan", onSave, onCancel }: Props) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isSaving}>
            <span className="material-symbols-outlined">close</span>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={!name.trim() || isSaving}>
            <span className="material-symbols-outlined">check</span>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <Form>
        <Form.Row cols={1}>
          <Form.Field label="Nombre del plan" required>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Plan Trabajo Turno Noche"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
            />
          </Form.Field>
        </Form.Row>
      </Form>
    </Modal>
  );
}
