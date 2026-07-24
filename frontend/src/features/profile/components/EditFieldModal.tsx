import { useState } from "react";
import { Modal } from "@/widgets/ui/Modal/Modal";
import { Form } from "@/widgets/ui/Form";
import { Input } from "@/widgets/ui/Input";
import { Button } from "@/widgets/ui/Button";
import { mapErrorMessage } from "@/shared/lib/errorMapper";

interface EditFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  label: string;
  value: string;
  type?: "text" | "email";
  fieldType?: "email" | "legajo" | "text";
  onSave: (value: string) => Promise<void>;
}

export function EditFieldModal({ isOpen, onClose, title, label, value, type = "text", fieldType = "text", onSave }: EditFieldModalProps) {
  const [inputValue, setInputValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setError("Este campo no puede estar vacío.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(inputValue.trim());
      onClose();
    } catch (err: any) {
      setError(mapErrorMessage(err, fieldType));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            <span className="material-symbols-outlined text-[24px]">close</span>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
            <span className="material-symbols-outlined text-[24px]">{saving ? "hourglass_top" : "save"}</span>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <Form>
        <Form.Field label={label} required error={error}>
          <Input
            label={undefined}
            type={type}
            value={inputValue}
            onChange={(e: any) => { setInputValue(e.target.value); setError(""); }}
            autoFocus
          />
        </Form.Field>
      </Form>
    </Modal>
  );
}