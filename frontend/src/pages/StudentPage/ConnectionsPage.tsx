import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/AuthContext';
import { useConnections } from '@/features/connections';
import { getStudents } from '@/entities/Student';
import type { Student } from '@/entities/Student';
import { Card } from '@/widgets/ui/Card';
import { PageHeader } from '@/widgets/ui/PageHeader';
import { FormField } from '@/widgets/ui/FormField';
import { Input } from '@/widgets/ui/Input';
import { Button } from '@/widgets/ui/Button';
import { SegmentedControl } from '@/widgets/ui/SegmentedControl';
import { Tag } from '@/widgets/ui/Tag';
import { SearchInput } from '@/widgets/ui/SearchInput';
import { resolveMediaUrl } from '@/shared/lib/resolveMediaUrl';

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function ConnectionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [invitingStudentId, setInvitingStudentId] = useState<string | null>(null);
  const {
    connections,
    isLoading,
    error,
    acceptConnection,
    rejectConnection,
    removeConnection,
    inviteByEmail,
  } = useConnections();

  const pendingConnections = connections.filter((c) => c.status === 'pending');
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const visibleConnections = useMemo(() => {
    if (statusFilter === 'pending') return pendingConnections;
    if (statusFilter === 'accepted') return acceptedConnections;
    return connections;
  }, [connections, pendingConnections, acceptedConnections, statusFilter]);

  useEffect(() => {
    let mounted = true;

    const loadStudents = async () => {
      setIsLoadingDirectory(true);
      setDirectoryError(null);
      try {
        const allStudents = await getStudents();
        if (!mounted) return;
        setStudents(allStudents);
      } catch (err: any) {
        if (!mounted) return;
        setDirectoryError(err?.message || 'No se pudo cargar el directorio');
      } finally {
        if (mounted) {
          setIsLoadingDirectory(false);
        }
      }
    };

    loadStudents();

    return () => {
      mounted = false;
    };
  }, []);

  const connectedStudentIds = useMemo(() => {
    return new Set(connections.map((conn) => conn.connectedUserId));
  }, [connections]);

  const connectionStatusByStudentId = useMemo(() => {
    return new Map(connections.map((conn) => [conn.connectedUserId, conn.status]));
  }, [connections]);

  const visibleStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const currentUserId = Number(user?.id);

    return students
      .filter((student) => Number(student.userId) !== currentUserId)
      .filter((student) => {
        if (!query) return true;
        const fullName = `${student.user?.name || ''} ${student.user?.lastname || ''}`.toLowerCase();
        const email = (student.user?.email || '').toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
  }, [students, user?.id, searchTerm]);

  const handleAccept = async (connectionId: string) => {
    try {
      await acceptConnection(connectionId);
    } catch (err: any) {
      console.error("Error accepting connection:", err);
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await rejectConnection(connectionId);
    } catch (err: any) {
      console.error("Error rejecting connection:", err);
    }
  };

  const handleRemove = async (connectionId: string) => {
    try {
      await removeConnection(connectionId);
    } catch (err: any) {
      console.error("Error removing connection:", err);
    }
  };

  const handleConnect = async (studentId: string, targetEmail?: string) => {
    if (!targetEmail) {
      setInviteError('No se pudo enviar la invitacion porque ese usuario no tiene email visible.');
      setInviteFeedback(null);
      return;
    }

    try {
      setInvitingStudentId(studentId);
      setInviteError(null);
      setInviteFeedback(null);
      const result = await inviteByEmail(targetEmail);
      setInviteFeedback(result.message || 'Solicitud procesada correctamente.');
    } catch (err: any) {
      setInviteError(err?.message || 'No se pudo enviar la invitacion');
    } finally {
      setInvitingStudentId(null);
    }
  };

  const handleInviteByEmail = async (event: FormEvent) => {
    event.preventDefault();
    setInviteError(null);
    setInviteFeedback(null);

    try {
      setIsInviting(true);
      const result = await inviteByEmail(inviteEmail);
      setInviteFeedback(result.message || 'Solicitud procesada correctamente.');

      if (result.invited) {
        setInviteEmail('');
      }
    } catch (err: any) {
      setInviteError(err?.message || 'No se pudo enviar la invitacion');
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-on-surface-variant">Cargando conexiones...</span>
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

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          className="mb-lg"
          eyebrow="Mis conexiones"
          title="Gestión de conexiones"
        />

        <SegmentedControl
          className="w-fit mb-3"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: `Todas (${connections.length})` },
            { value: 'pending', label: `Pendientes (${pendingConnections.length})` },
            { value: 'accepted', label: `Conectados (${acceptedConnections.length})` },
          ]}
        />

        {visibleConnections.length === 0 ? (
          <Card bodyClassName="text-center p-8" className="mb-lg">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
              people_outline
            </span>
            <p className="text-on-surface-variant font-body-md text-body-md">
              {statusFilter === 'pending'
                ? 'No hay solicitudes pendientes.'
                : statusFilter === 'accepted'
                  ? 'No hay conexiones aceptadas.'
                  : 'No hay conexiones aún.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-lg">
            {visibleConnections.map((connection) => {
              const connectionAvatarSrc = resolveMediaUrl(connection.userImage);

              return (
                <Card key={connection.id}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                      {connectionAvatarSrc ? (
                        <img
                          src={connectionAvatarSrc}
                          alt={`Avatar de ${connection.userName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(connection.userName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-title-sm text-title-sm text-on-surface truncate">{connection.userName}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{connection.userEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 px-2 py-1 bg-surface-container rounded font-label-caps text-[10px]">
                    <span className="material-symbols-outlined text-[14px]">
                      {connection.status === 'pending' ? 'schedule' : 'check_circle'}
                    </span>
                    {connection.status === 'pending' ? 'Pendiente' : 'Conectado'}
                  </div>

                  {connection.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button variant="primary" className="flex-1" onClick={() => handleAccept(connection.id)}>
                        <span className="material-symbols-outlined text-[24px]">check</span>
                        Aceptar
                      </Button>
                      <Button variant="danger" className="flex-1" onClick={() => handleReject(connection.id)}>
                        <span className="material-symbols-outlined text-[24px]">close</span>
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="primary" className="flex-1"
                        onClick={() =>
                          navigate(`/student/profile/${connection.connectedUserId}`, {
                            state: {
                              name: connection.userName,
                              avatar: connection.userImage,
                            },
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-[24px]">visibility</span>
                        Ver perfil
                      </Button>
                      <Button variant="danger" className="flex-1" onClick={() => handleRemove(connection.id)}>
                        <span className="material-symbols-outlined text-[24px]">person_remove</span>
                        Desconectar
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Card header={<h2 className="font-title-sm text-title-sm text-on-surface">Invitar por email</h2>} className="mb-lg">
          <form onSubmit={handleInviteByEmail} className="space-y-3">
            <FormField label="Email del destinatario" error={inviteError || ''} required>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="alumno@universidad.edu.ar"
                disabled={isInviting}
              />
            </FormField>

            <div className="flex justify-end">
              <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? (
                  'Enviando...'
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px]">send</span>
                    Enviar invitacion
                  </>
                )}
              </Button>
            </div>
          </form>

          {inviteFeedback ? (
            <p className="mt-3 text-body-sm text-on-surface-variant">{inviteFeedback}</p>
          ) : null}
        </Card>

        <Card
          className="mb-lg"
          header={
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="font-title-sm text-title-sm text-on-surface">Directorio de estudiantes</h2>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre o email"
                className="w-full md:w-80"
              />
            </div>
          }
        >

          {isLoadingDirectory ? (
            <p className="text-on-surface-variant">Cargando directorio...</p>
          ) : directoryError ? (
            <p className="text-error">{directoryError}</p>
          ) : visibleStudents.length === 0 ? (
            <p className="text-on-surface-variant">No hay estudiantes que coincidan con la búsqueda.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleStudents.map((student) => {
                const studentId = String(student.userId);
                const isConnected = connectedStudentIds.has(studentId);
                const connectionStatus = connectionStatusByStudentId.get(studentId);
                const isPending = connectionStatus === 'pending';
                const isPublic = student.publicProfile;
                const isInvitingThisCard = invitingStudentId === studentId;
                const fullName = `${student.user?.name || ''} ${student.user?.lastname || ''}`.trim() || 'Usuario';
                const studentAvatarSrc = resolveMediaUrl(student.user?.avatar);

                return (
                  <Card key={student.userId}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container text-white font-semibold flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {studentAvatarSrc ? (
                            <img src={studentAvatarSrc} alt={`Avatar de ${fullName}`} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(fullName)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                        <h3 className="font-title-sm text-title-sm text-on-surface truncate">
                          {student.user?.name} {student.user?.lastname}
                        </h3>
                        </div>
                      </div>
                      <Tag variant={isPublic ? 'positive' : 'danger'} className="shrink-0">
                        {isPublic ? 'Público' : 'Privado'}
                      </Tag>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() =>
                          navigate(`/student/profile/${student.userId}`, {
                            state: {
                              name: fullName,
                              avatar: studentAvatarSrc,
                            },
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-[24px]">visibility</span>
                        Ver perfil
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleConnect(studentId, student.user?.email)}
                        disabled={isConnected || isInvitingThisCard}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {isInvitingThisCard ? 'hourglass_top' : isPending ? 'schedule' : isConnected ? 'check_circle' : 'person_add'}
                        </span>
                        {isInvitingThisCard ? 'Enviando...' : isPending ? 'Pendiente' : isConnected ? 'Conectado' : 'Conectar'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
