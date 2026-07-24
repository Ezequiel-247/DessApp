import { useState, useRef, useEffect } from "react";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { SegmentedControl } from "@/widgets/ui/SegmentedControl";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { FormError } from "@/widgets/ui/FormError";
import { ManageEnrollmentModal } from "@/features/profile";
import { getPlans } from "@/entities/Plan";
import { UserInfoTab } from "./UserInfoTab";
import { StudentTab } from "./StudentTab";
import { AdminTab } from "./AdminTab";
import { useUserForm } from "../hooks/useUserForm";
import type { Career } from "@/entities/Career/model/career";

interface Props {
  selectedUser: any | null;
  careersOptions: Career[];
  onDelete: (id: string) => void;
  onSaved: () => void;
  onCreated: () => void;
}

export function UserFormPanel({ selectedUser, careersOptions, onDelete, onSaved, onCreated }: Props) {
  const {
    draft,
    activeTab,
    tabs,
    saving,
    validationErrors,
    isFirstTab,
    handleFieldChange,
    handleSave,
    handleNext,
    handleTabChange,
    handleAddFullEnrollment,
    handleRemoveEnrollment,
    handleResetWithConfirm,
    confirmOpen,
    confirmOptions,
    closeConfirm,
    execConfirm,
  } = useUserForm({ selectedUser, careersOptions, onSaved, onCreated });

  const [enrollmentModal, setEnrollmentModal] = useState<{ open: boolean; enrollment: any | null }>({ open: false, enrollment: null });
  const [plans, setPlans] = useState<any[]>([]);
  const editingTempIdRef = useRef<number | null>(null);

  useEffect(() => { getPlans().then(setPlans).catch(() => {}); }, []);

  const excludedCareerIds = draft.enrollments
    .filter((e) => !editingTempIdRef.current || e.tempId !== editingTempIdRef.current)
    .map((e) => e.careerId);

  const isEdit = !!selectedUser;
  const segOptions = tabs.map((t) => ({ value: t.id, label: t.label }));

  return (
    <Card
      className="xl:col-span-7 flex flex-col h-full"
      bodyClassName="flex-1 overflow-y-auto"
      header={
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface">
            {isEdit ? "edit" : "add"}
          </span>
          <h2 className="font-title-sm text-title-sm text-on-surface">
            {isEdit ? "Editar usuario" : "Alta de usuario"}
          </h2>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse gap-3 xl:flex-row">
          {isFirstTab ? (
            <>
              <div className="flex-1 flex flex-col">
                {isEdit ? (
                  <Button variant="danger" onClick={() => onDelete(selectedUser.id)}>
                    <span className="material-symbols-outlined text-[24px]">delete</span>
                    Borrar
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={handleResetWithConfirm}>
                    <span className="material-symbols-outlined text-[24px]">close</span>
                    Limpiar
                  </Button>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <Button variant="primary" onClick={handleNext}>
                  <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                  Siguiente
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 flex flex-col">
                <Button variant="secondary" onClick={() => handleTabChange("usuario")}>
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                  Volver atrás
                </Button>
              </div>
              <div className="flex-1 flex flex-col">
                <Button variant="secondary" onClick={handleResetWithConfirm}>
                  <span className="material-symbols-outlined text-[24px]">close</span>
                  Limpiar
                </Button>
              </div>
              <div className="flex-1 flex flex-col">
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  <span className="material-symbols-outlined text-[24px]">{isEdit ? "save" : "add"}</span>
                  {saving ? "Guardando..." : isEdit ? "Guardar usuario" : "Crear"}
                </Button>
              </div>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {tabs.length > 1 && (
          <SegmentedControl
            value={activeTab}
            onChange={handleTabChange}
            options={segOptions}
            className="w-fit"
          />
        )}

        {Object.keys(validationErrors).length > 0 && (
          <FormError errors={validationErrors as Record<string, string>} />
        )}

        {activeTab === "usuario" && (
          <UserInfoTab draft={draft} validationErrors={validationErrors} onFieldChange={handleFieldChange} isEdit={isEdit} />
        )}

        {activeTab === "estudiante" && (
          <StudentTab
            draft={draft}
            plans={plans}
            validationErrors={validationErrors}
            onFieldChange={handleFieldChange}
            careersOptions={careersOptions}
            onOpenEnrollmentModal={(state) => {
              if (state.enrollment?.tempId) editingTempIdRef.current = state.enrollment.tempId;
              else editingTempIdRef.current = null;
              setEnrollmentModal(state);
            }}
            onAddFullEnrollment={handleAddFullEnrollment}
            onRemoveEnrollment={handleRemoveEnrollment}
          />
        )}

        {activeTab === "administrador" && (
          <AdminTab draft={draft} validationErrors={validationErrors} onFieldChange={handleFieldChange} />
        )}
      </div>

      {confirmOpen && confirmOptions && (
        <ConfirmDialog
          isOpen={confirmOpen}
          title={confirmOptions.title || "Confirmar"}
          description={confirmOptions.description}
          confirmLabel={confirmOptions.confirmLabel || "Aceptar"}
          cancelLabel={confirmOptions.cancelLabel || "Cancelar"}
          variant={confirmOptions.variant || "primary"}
          onConfirm={() => execConfirm()}
          onCancel={closeConfirm}
        />
      )}

      <ManageEnrollmentModal
        isOpen={enrollmentModal.open}
        onClose={() => { setEnrollmentModal({ open: false, enrollment: null }); editingTempIdRef.current = null; }}
        onSaved={() => {}}
        excludedCareerIds={excludedCareerIds}
        enrollment={enrollmentModal.enrollment}
        onEnrollmentData={(data) => {
          if (editingTempIdRef.current) {
            handleRemoveEnrollment(editingTempIdRef.current);
          }
          handleAddFullEnrollment(data.career_id, data.study_plan_id ?? null, data.enrolled_at);
          setEnrollmentModal({ open: false, enrollment: null });
          editingTempIdRef.current = null;
        }}
        onLocalDelete={() => {
          if (editingTempIdRef.current) {
            handleRemoveEnrollment(editingTempIdRef.current);
          }
          setEnrollmentModal({ open: false, enrollment: null });
          editingTempIdRef.current = null;
        }}
      />
    </Card>
  );
}
