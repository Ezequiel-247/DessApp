import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/app/AuthContext";
import { useProfile, EditFieldModal, ManageEnrollmentModal } from "@/features/profile";
import type { StudentCareerEnrollment } from "@/entities/StudentCareerEnrollment";
import { resolveMediaUrl } from '@/shared/lib/resolveMediaUrl';
import { Toggle } from '@/widgets/ui/Toggle';
import { Card } from '@/widgets/ui/Card';
import { Button } from '@/widgets/ui/Button';
import { SegmentedControl } from '@/widgets/ui/SegmentedControl';
import { PageHeader } from '@/widgets/ui/PageHeader';
import { StatusBadge } from '@/widgets/ui/StatusBadge';

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, isLoading, error, fetchProfile, updatePrivacy, updateEmail, updateLegajo, updateAvatar } = useProfile();
  const [editingField, setEditingField] = useState<"email" | "legajo" | null>(null);
  const [manageEnrollment, setManageEnrollment] = useState<{ open: boolean; enrollment: StudentCareerEnrollment | null }>({ open: false, enrollment: null });
  const [rightTab, setRightTab] = useState("privacy");
  const [privacy, setPrivacy] = useState(profile?.privacy ?? {
    publicProfile: false,
    showAcademicInfo: false,
    publishApprovals: false,
    showEmail: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (profile) {
      setPrivacy(profile.privacy);
    }
  }, [profile]);

  const handleToggle = (field: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveFeedback(null);
    try {
      const updated = await updatePrivacy(privacy);
      const persisted = updated?.privacy;

      const matchesPersisted = persisted
        ? persisted.publicProfile === privacy.publicProfile
          && persisted.showAcademicInfo === privacy.showAcademicInfo
          && persisted.publishApprovals === privacy.publishApprovals
          && persisted.showEmail === privacy.showEmail
        : false;

      if (matchesPersisted) {
        setSaveFeedback({
          type: 'success',
          message: 'Cambios guardados correctamente.',
        });
      } else {
        setSaveFeedback({
          type: 'error',
          message: 'No se pudo confirmar el guardado completo. Intentá nuevamente.',
        });
      }
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (err: any) {
      setSaveFeedback({
        type: 'error',
        message: err?.message || 'Error al guardar cambios de privacidad.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      await updateAvatar(file);
    } catch {
      // error is handled at hook/api level
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-on-surface-variant">Cargando perfil...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-error">{error}</span>
      </div>
    );
  }

  if (!profile) return null;

  const avatarSrc =
    resolveMediaUrl(profile.avatar) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}`;

  return (
    <>
      <div className="flex flex-col gap-3">
      <PageHeader
        eyebrow="Informacion personal"
        title="Mi Perfil"
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* Card 1: Personal Info */}
        <Card
          className="col-span-12 lg:col-span-4 overflow-hidden"
          header={<div className="h-32 bg-surface-variant" />}
          headerClassName="!p-0 border-b-0"
          bodyClassName="flex flex-col items-center"
          footerClassName="flex flex-col gap-4"
          footer={
            <>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">
                  account_balance
                </span>
                <div>
                  <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-1">
                    Universidad
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    {profile.university}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">
                  mail
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                      Correo Institucional
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingField("email")}
                      className="text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">
                  badge
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                      Matrícula
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingField("legajo")}
                      className="text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface truncate">
                    {profile.enrollment ?? "Sin asignar"}
                  </p>
                </div>
              </div>
            </>
          }
        >
          <div className="flex flex-col items-center w-full -mt-16">
            {/* Avatar */}
            <div className="relative mb-6">
              <img
                alt="Foto de perfil"
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-sm bg-surface"
                src={avatarSrc}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-on-primary-fixed-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isUploadingAvatar ? "hourglass_top" : "photo_camera"}
                </span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarInput}
              />
            </div>

            <h3 className="font-headline-md text-headline-md text-on-surface text-center mb-1">
              {profile.displayName}
            </h3>
            <p className="font-body-md text-body-md text-primary font-medium text-center mb-4">
              {profile.careerName}
            </p>
          </div>
        </Card>

        {/* Card 2: Privacy + Enrollments (tabbed) */}
        <Card
          className="col-span-12 lg:col-span-8 flex flex-col"
          header={
            <div className="flex-1 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">
                {rightTab === "privacy" ? "shield_person" : "school"}
              </span>
              <h3 className="font-title-sm text-title-sm text-on-surface">
                {rightTab === "privacy" ? "Configuración de Privacidad" : "Datos del Estudiante"}
              </h3>
              <div className="ml-auto">
              <SegmentedControl
                value={rightTab}
                onChange={setRightTab}
                options={[
                  { value: "privacy", label: "Privacidad" },
                  { value: "enrollments", label: "Carreras" },
                ]}
                className="w-fit"
              />
              </div>
            </div>
          }
          headerClassName="flex items-center"
          bodyClassName="flex flex-col flex-1"
          footer={
            rightTab === "privacy" ? (
              <div className="flex flex-col gap-3">
                {saveFeedback && (
                  <span
                    className={`text-body-sm flex items-center gap-1 rounded-full px-3 py-1 ${
                      saveFeedback.type === 'success'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {saveFeedback.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {saveFeedback.message}
                  </span>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setPrivacy(profile.privacy)} disabled={saving} className="flex-1">
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
                    <span className="material-symbols-outlined text-[24px]">
                      {saving ? "hourglass_top" : "save"}
                    </span>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="primary" className="w-full" onClick={() => setManageEnrollment({ open: true, enrollment: null })}>
                <span className="material-symbols-outlined text-[24px]">add</span>
                Agregar carrera
              </Button>
            )
          }
        >
          {rightTab === "privacy" && (
            <div className="flex flex-col flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b border-surface-dim first:pt-0">
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">public</span>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Perfil Público</p>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Permite que otros estudiantes y profesores te encuentren en el directorio de la universidad.
                  </p>
                </div>
                <Toggle
                  checked={privacy.publicProfile}
                  onChange={() => handleToggle("publicProfile")}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b border-surface-dim">
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">school</span>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Mostrar Situación Académica</p>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Comparte tu cuatrimestre actual y especialidad en tu tarjeta de perfil público.
                  </p>
                </div>
                <Toggle
                  checked={privacy.showAcademicInfo}
                  onChange={() => handleToggle("showAcademicInfo")}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b border-surface-dim">
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">military_tech</span>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Publicar Novedades Académicas</p>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Comparte en Novedades tus cambios de inscripcion, regularizacion y aprobacion de materias.
                  </p>
                </div>
                <Toggle
                  checked={privacy.publishApprovals}
                  onChange={() => handleToggle("publishApprovals")}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 last:pb-0">
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">contact_mail</span>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">Mostrar Email de contacto</p>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Permite que tutores y compañeros puedan enviarte correos directamente desde la plataforma.
                  </p>
                </div>
                <Toggle
                  checked={privacy.showEmail}
                  onChange={() => handleToggle("showEmail")}
                />
              </div>
            </div>
          )}

          {rightTab === "enrollments" && (
            <div className="flex flex-col max-h-[500px]">
              <div className="overflow-y-auto flex-1 flex flex-col gap-md">
                {profile.enrollments.length === 0 ? (
                  <p className="font-body-md text-body-md text-on-surface-variant">Sin inscripciones a carreras.</p>
                ) : (
                  profile.enrollments.map((enrollment) => (
                    <Card key={enrollment.id} bodyClassName="flex flex-col gap-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">school</span>
                        <span className="font-title-sm text-title-sm text-on-surface">{enrollment.career?.name}</span>
                        <Button variant="ghost" className="!p-1" onClick={() => setManageEnrollment({ open: true, enrollment })}>
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Button>
                        {enrollment.isActive && (
                          <StatusBadge variant="positive" label="Activo" className="ml-auto" />
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm text-body-sm">
                        {enrollment.studyPlan && (
                          <div>
                            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Plan</span>
                            <p className="text-on-surface">{enrollment.studyPlan.name} ({enrollment.studyPlan.status})</p>
                          </div>
                        )}
                        <div>
                          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Inicio</span>
                          <p className="text-on-surface">{new Date(enrollment.enrolledAt).toLocaleDateString('es-AR')}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      <ManageEnrollmentModal
        isOpen={manageEnrollment.open}
        onClose={() => setManageEnrollment({ open: false, enrollment: null })}
        onSaved={fetchProfile}
        studentId={Number(user?.id)}
        enrollment={manageEnrollment.enrollment}
        excludedCareerIds={profile.enrollments.filter(e => e.isActive).map(e => Number(e.careerId))}
      />

      <EditFieldModal
        isOpen={editingField === "email"}
        onClose={() => setEditingField(null)}
        title="Editar correo institucional"
        label="Correo electrónico"
        value={profile.email}
        type="email"
        fieldType="email"
        onSave={updateEmail}
      />

      <EditFieldModal
        isOpen={editingField === "legajo"}
        onClose={() => setEditingField(null)}
        title="Editar matrícula"
        label="Matrícula / Legajo"
        value={profile.enrollment ?? ""}
        fieldType="legajo"
        onSave={updateLegajo}
      />
      </div>
    </>
  );
}
