import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getStudentProfile } from '@/entities/Student';
import type { Student } from '@/entities/Student';
import { Card } from '@/widgets/ui/Card';
import { Button } from '@/widgets/ui/Button';
import { PageHeader } from '@/widgets/ui/PageHeader';
import { StatusBadge } from '@/widgets/ui/StatusBadge';
import { resolveMediaUrl } from '@/shared/lib/resolveMediaUrl';

type ProfileNavigationState = {
  name?: string;
  avatar?: string | null;
};

export function StudentPublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const navigationState = (location.state as ProfileNavigationState | null) ?? null;

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!id) {
        setError('Perfil inválido');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsPrivate(false);

      try {
        const data = await getStudentProfile(id);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const message = err?.message ?? 'No se pudo cargar el perfil';
        setError(message);
        if (message.toLowerCase().includes('private')) {
          setIsPrivate(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const displayName = useMemo(() => {
    if (!profile?.user) return 'Estudiante';
    return `${profile.user.name} ${profile.user.lastname}`;
  }, [profile]);

  const avatarSrc =
    resolveMediaUrl(profile?.user?.avatar) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
  const privateDisplayName = navigationState?.name?.trim() || 'Estudiante';
  const privateAvatarSrc =
    resolveMediaUrl(navigationState?.avatar) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${privateDisplayName}`;
  const academicRecords = profile?.academicRecords ?? [];
  const hasAcademicInfo = profile ? profile.enrollments.length > 0 || academicRecords.length > 0 : false;

  const formatAcademicStatus = (status: string) => {
    if (!status) return 'Sin estado';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-on-surface-variant">Cargando perfil...</span>
      </div>
    );
  }

  if (!isPrivate && (error || !profile)) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-error">{error ?? 'No se encontró el perfil solicitado'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Informacion personal"
        title="Visitando perfil"
        actions={
        <Button variant="secondary" onClick={() => navigate('/student/connections')}>
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            Volver a conexiones
          </Button>
        }
      />

      {isPrivate ? (
        <Card
          className="bg-surface-container-lowest"
          bodyClassName="flex flex-col items-center text-center"
        >
          <div className="relative mb-4">
            <img
              alt={`Avatar de ${privateDisplayName}`}
              className="w-24 h-24 rounded-full border-4 border-surface object-cover shadow-sm"
              src={privateAvatarSrc}
            />
            <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center border-2 border-surface-container-lowest">
              <span className="material-symbols-outlined text-[20px]">lock_person</span>
            </span>
          </div>

          <p className="font-title-sm text-title-sm text-on-surface mb-1">{privateDisplayName}</p>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Perfil privado</h2>
          <p className="text-on-surface-variant max-w-md">
            Solo los contactos pueden ver los detalles de este perfil.
          </p>
        </Card>
      ) : profile && (
        <div className="grid grid-cols-12 gap-gutter">
      <Card
        className="col-span-12 lg:col-span-4 overflow-hidden"
        header={<div className="h-32 bg-surface-variant" />}
        headerClassName="!p-0 border-b-0"
        bodyClassName="flex flex-col items-center"
        footerClassName="flex flex-col gap-4"
        footer={
          <>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline text-[20px]">account_balance</span>
              <div>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-1">
                  Universidad
                </p>
                <p className="font-body-sm text-body-sm text-on-surface">
                  Universidad Nacional de Hurlingham
                </p>
              </div>
            </div>
            {profile.user?.email && (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                <div>
                  <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-1">
                    Correo Institucional
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface truncate">{profile.user.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline text-[20px]">badge</span>
              <div>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-1">
                  Matrícula
                </p>
                <p className="font-body-sm text-body-sm text-on-surface">{profile.legajo ?? "Sin asignar"}</p>
              </div>
            </div>
          </>
        }
      >
        <div className="flex flex-col items-center w-full -mt-16">
          <img
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-sm bg-surface mb-6"
            src={avatarSrc}
          />
          <h2 className="font-headline-md text-headline-md text-on-surface text-center">{displayName}</h2>
          <p className="font-body-md text-body-md text-primary font-medium text-center mb-4">
            {profile.enrollments.find((e) => e.isActive)?.career?.name ?? 'Sin carrera asignada'}
          </p>
        </div>
      </Card>

      <Card
        className="col-span-12 lg:col-span-8 flex flex-col"
        header={
          <div className="flex-1 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
            <h3 className="font-title-sm text-title-sm text-on-surface">Datos del estudiante</h3>
          </div>
        }
        headerClassName="flex items-center"
        bodyClassName="flex flex-col gap-md flex-1"
      >
        {!hasAcademicInfo ? (
          <p className="text-on-surface-variant">No hay información académica visible para este perfil.</p>
        ) : (
          <>
            {profile.enrollments.length > 0 && (
              <div className="space-y-sm">
                {profile.enrollments.map((enrollment) => (
                  <Card key={enrollment.id} bodyClassName="flex flex-col gap-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">school</span>
                      <span className="font-title-sm text-title-sm text-on-surface">{enrollment.career?.name ?? 'Carrera'}</span>
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
                  ))}
                </div>
            )}

            {academicRecords.length > 0 && (
              <div>
                <h4 className="font-title-xs text-title-xs text-on-surface mb-2">Materias cursadas</h4>
                <div className="space-y-sm">
                  {academicRecords.map((record) => (
                    <Card key={record.id} bodyClassName="flex flex-col gap-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">menu_book</span>
                        <span className="font-title-sm text-title-sm text-on-surface">{record.subjectName}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm text-body-sm">
                        <div>
                          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Estado</span>
                          <p className="text-on-surface">{formatAcademicStatus(record.status)}</p>
                        </div>
                        {record.grade && (
                          <div>
                            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Nota</span>
                            <p className="text-on-surface">{record.grade}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Período</span>
                          <p className="text-on-surface">{record.year} · {record.semester}° cuatrimestre</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      </div>
      )}
    </div>
  );
}
