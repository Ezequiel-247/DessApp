import { Form } from "@/widgets/ui/Form";
import { Input } from "@/widgets/ui/Input";
import type { UnifiedDraft } from "../hooks/useUserForm";

interface Props {
  draft: UnifiedDraft;
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof UnifiedDraft, value: any) => void;
}

export function AdminTab({ draft, validationErrors, onFieldChange }: Props) {
  return (
    <Form>
      <Form.Row cols={2}>
        <Input label="CUIL" required value={draft.cuil} onChange={(e) => onFieldChange("cuil", e.target.value)} error={validationErrors.cuil} placeholder="Ej. 20-12345678-9" />
      </Form.Row>
    </Form>
  );
}
