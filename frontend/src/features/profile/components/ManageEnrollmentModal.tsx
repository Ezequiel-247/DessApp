import { useState, useEffect } from "react";
import { Modal } from "@/widgets/ui/Modal/Modal";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { Form } from "@/widgets/ui/Form";
import { Input, InputSelect } from "@/widgets/ui/Input";
import { Button } from "@/widgets/ui/Button";
import { FormError } from "@/widgets/ui/FormError";
import { mapErrorMessage } from "@/shared/lib/errorMapper";
import { getCareers } from "@/entities/Career";
import { getPlans } from "@/entities/Plan";
import { createEnrollment, updateEnrollment, deleteEnrollment } from "@/entities/StudentCareerEnrollment";
import type { Career } from "@/entities/Career";
import type { Plan } from "@/entities/Plan";
import type { StudentCareerEnrollment } from "@/entities/StudentCareerEnrollment";

interface ManageEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  studentId?: number;
  enrollment?: StudentCareerEnrollment | null;
  excludedCareerIds: number[];
  onEnrollmentData?: (data: { career_id: number; study_plan_id?: number | null; enrolled_at: string; completed_at?: string | null }) => void;
  onLocalDelete?: () => void;
}

export function ManageEnrollmentModal({ isOpen, onClose, onSaved, studentId, enrollment, excludedCareerIds, onEnrollmentData, onLocalDelete }: ManageEnrollmentModalProps) {
  const [careers, setCareers] = useState<Career[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [careerId, setCareerId] = useState<number | null>(null);
  const [studyPlanId, setStudyPlanId] = useState<number | null>(null);
  const [enrolledAt, setEnrolledAt] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = !!enrollment;

  useEffect(() => {
    if (isOpen) {
      getCareers().then(setCareers).catch(() => {});
      getPlans().then(setPlans).catch(() => {});
      if (enrollment) {
        setCareerId(enrollment.careerId);
        setStudyPlanId(enrollment.studyPlanId);
        setEnrolledAt(enrollment.enrolledAt);
      } else {
        setCareerId(null);
        setStudyPlanId(null);
        setEnrolledAt("");
      }
      setError("");
    }
  }, [isOpen, enrollment]);

  const isLocal = !!onEnrollmentData;

  const handleSave = async () => {
    if (!isEdit && !careerId) { setError("Seleccioná una carrera."); return; }
    if (!studyPlanId) { setError("Seleccioná un plan."); return; }
    if (!enrolledAt) { setError("Seleccioná una fecha de inicio."); return; }

    setSaving(true);
    setError("");
    try {
      const data = { career_id: careerId!, study_plan_id: studyPlanId, enrolled_at: enrolledAt };
      if (isLocal) {
        onEnrollmentData(data);
      } else if (isEdit && enrollment) {
        await updateEnrollment(studentId!, enrollment.id, {
          study_plan_id: studyPlanId,
          enrolled_at: enrolledAt,
        });
      } else {
        await createEnrollment(studentId!, {
          career_id: careerId!,
          study_plan_id: studyPlanId,
          enrolled_at: enrolledAt,
        });
      }
      if (!isLocal) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!enrollment) return;

    if (isLocal) {
      onLocalDelete?.();
      onClose();
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteEnrollment(studentId!, enrollment.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(mapErrorMessage(err, "enrollment"));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const selectedCareerId = careerId;
  const availableCareers = careers.filter(
    (c) => isEdit || !excludedCareerIds.includes(Number(c.id))
  );

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar inscripción" : "Agregar carrera"}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving || deleting}>
            <span className="material-symbols-outlined text-[24px]">close</span>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving || deleting}>
            <span className="material-symbols-outlined text-[24px]">{saving ? "hourglass_top" : "save"}</span>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          {isEdit && (
            <Button variant="danger" className="w-12 h-12 flex items-center justify-center" onClick={() => setConfirmDelete(true)} disabled={deleting || saving}>
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </Button>
          )}
        </div>
      }
    >
      <Form>
        {isEdit ? (
          <Form.Field label="Carrera" required>
            <Input label={undefined} value={enrollment?.career?.name ?? ""} disabled />
          </Form.Field>
        ) : (
          <Form.Field label="Carrera" required>
            <InputSelect error={undefined} disabled={false} value={careerId ?? ""} onChange={(e: any) => { setCareerId(e.target.value ? Number(e.target.value) : null); setStudyPlanId(null); }}>
              <option value="">Seleccionar carrera</option>
              {availableCareers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </InputSelect>
          </Form.Field>
        )}

        <Form.Field label="Plan de estudio" required>
          <InputSelect error={undefined} disabled={!selectedCareerId} value={studyPlanId ?? ""} onChange={(e: any) => setStudyPlanId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Seleccionar plan</option>
            {plans
              .filter((p) => Number(p.careerId) === Number(selectedCareerId))
              .map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
              ))}
          </InputSelect>
        </Form.Field>

        <Form.Field label="Fecha de inicio" required>
          <Input label={undefined} type="date" value={enrolledAt} onChange={(e: any) => setEnrolledAt(e.target.value)} />
        </Form.Field>

        {error && <FormError message={error} errors={undefined as any} />}
      </Form>
    </Modal>

    <ConfirmDialog
      isOpen={confirmDelete}
      onCancel={() => setConfirmDelete(false)}
      onConfirm={handleDelete}
      title="Eliminar inscripción"
      description={`¿Eliminar la inscripción a "${enrollment?.career?.name ?? "esta carrera"}"? Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      variant="danger"
    />
    </>
  );
}