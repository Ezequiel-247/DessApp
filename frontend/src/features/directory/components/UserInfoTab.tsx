import { Form } from "@/widgets/ui/Form";
import { Input, InputSelect } from "@/widgets/ui/Input";
import { InputToggle } from "@/widgets/ui/InputToggle";
import type { UnifiedDraft } from "../hooks/useUserForm";

interface Props {
  draft: UnifiedDraft;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof UnifiedDraft, value: any) => void;
  isEdit: boolean;
}

export function UserInfoTab({ draft, validationErrors, onFieldChange, isEdit }: Props) {
  return (
    <Form>
      <Form.Row cols={1} className="xl:grid-cols-2">
        <Input label="Nombre" required value={draft.name} onChange={(e) => onFieldChange("name", e.target.value)} error={validationErrors.name} placeholder="Ej. Juan" />
        <Input label="Apellido" required value={draft.lastname} onChange={(e) => onFieldChange("lastname", e.target.value)} error={validationErrors.lastname} placeholder="Ej. Pérez" />
      </Form.Row>

      <Form.Row cols={1} className="xl:grid-cols-2">
        <Input label="Email" required type="email" value={draft.email} onChange={(e) => onFieldChange("email", e.target.value)} error={validationErrors.email} placeholder="ejemplo@instituto.edu.ar" />
        {!isEdit && (
          <Input label="Contraseña" required type="password" value={draft.password} onChange={(e) => onFieldChange("password", e.target.value)} error={validationErrors.password} placeholder="Mín. 8 caracteres" />
        )}
        {isEdit && (
          <Input label="Contraseña" type="password" value={draft.password} onChange={(e) => onFieldChange("password", e.target.value)} placeholder="Dejar vacío para no cambiar" />
        )}
      </Form.Row>

      <Form.Row cols={1} className="xl:grid-cols-2">
        <div className="flex flex-col gap-xs">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Rol</span>
          <InputSelect value={draft.role} onChange={(e) => onFieldChange("role", e.target.value)}>
            <option value="student">Estudiante</option>
            <option value="admin">Administrador</option>
          </InputSelect>
        </div>
        <InputToggle
          label="Activo"
          checked={draft.isActive}
          onChange={(checked: boolean) => onFieldChange("isActive", checked)}
        />
      </Form.Row>
    </Form>
  );
}
