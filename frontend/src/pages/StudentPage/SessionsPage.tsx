/**
 * SessionsPage - Sesiones de Estudio
 * Nexo - Stitch Design System
 */
import { useState, useEffect } from "react";
import { useSessions } from "@/features/sessions/hooks/useSessions";
import { PageHeader } from "@/widgets/ui/PageHeader";

import { EmptyState } from "@/widgets/ui/EmptyState";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { Input, InputSelect } from "@/widgets/ui/Input";
import { InputToggle } from "@/widgets/ui/InputToggle";
import { Form } from "@/widgets/ui/Form";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { Tag } from "@/widgets/ui/Tag";
import { useAuth } from "@/app/AuthContext";
import { getStudentPlanSubjects } from "@/entities/Student/api/studentApi";
import { getStudentSubjects, getSubjects } from "@/entities/Subject";
import { getEnrollments } from "@/entities/StudentCareerEnrollment/api/studentCareerEnrollmentApi";
import { getAcademicRecords } from "@/entities/AcademicRecord";
import { Modal } from "@/widgets/ui/Modal";
import { FormError } from "@/widgets/ui/FormError";
import { ProductTour, type TourStep } from "@/features/onboarding";

const sessionsTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Sesiones de estudio",
    content: "Organizá o sumate a sesiones de estudio con otros estudiantes.",
  },
  {
    target: '[data-tour="sessions-create"]',
    title: "Crear una sesión",
    content: "Armá tu propia sesión de estudio: elegí materia, modalidad, fecha y cupos.",
  },
  {
    target: '[data-tour="sessions-subjects-filter"]',
    title: "Filtrar por materia",
    content: "Mostrá solo las sesiones de una materia puntual.",
  },
  {
    target: '[data-tour="sessions-filters"]',
    title: "Más filtros",
    content: "Filtrá por modalidad, mostrá solo en las que estás inscripto, las tuyas propias, u ocultá las que ya no tienen cupo.",
  },
  {
    target: '[data-tour="sessions-list"]',
    title: "Sesiones disponibles",
    content: "Acá aparecen todas las sesiones. Uníte, o si sos el organizador, gestioná las solicitudes.",
  },
];

interface SubjectOption {
  id: number;
  name: string;
}

export function SessionsPage() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("");
  const [filterEnrollment, setFilterEnrollment] = useState<string>("todos");
  const [hideFull, setHideFull] = useState(false);
  const [filterSubjectId, setFilterSubjectId] = useState<string>("");
  const { 
    sessions, 
    isLoading, 
    error, 
    createSession, 
    joinSession, 
    leaveSession, 
    cancelSession, 
    approveParticipant, 
    rejectParticipant,
    removeParticipant 
  } = useSessions({ type: filterType || undefined, subjectId: filterSubjectId || undefined });
  
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [unahurSubjects, setUnahurSubjects] = useState<SubjectOption[]>([]);
  const [academicRecordSubjectIds, setAcademicRecordSubjectIds] = useState<Set<string>>(new Set());
  const [isUnahur, setIsUnahur] = useState(false);
  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<{ id: number; msg: string } | null>(null);
  const [subjectLoadError, setSubjectLoadError] = useState<string | null>(null);

  const handleJoin = async (sessionId: number) => {
    setActionLoadingId(sessionId);
    setActionError(null);
    try {
      await Promise.all([
        joinSession(sessionId),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
    } catch (err: any) {
      setActionError({ id: sessionId, msg: err.message || 'Error al unirse' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLeave = async (sessionId: number) => {
    setActionLoadingId(sessionId);
    setActionError(null);
    try {
      await Promise.all([
        leaveSession(sessionId),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
    } catch (err: any) {
      setActionError({ id: sessionId, msg: err.message || 'Error al abandonar' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveParticipant = async (sessionId: number, registrationId: number) => {
    setParticipantActionLoadingId(registrationId);
    setActionError(null);
    try {
      await approveParticipant(sessionId, registrationId);
    } catch (err: any) {
      setActionError({ id: sessionId, msg: err.message || 'Error al aprobar participante' });
    } finally {
      setParticipantActionLoadingId(null);
    }
  };

  const handleRejectParticipant = async (sessionId: number, registrationId: number) => {
    setParticipantActionLoadingId(registrationId);
    setActionError(null);
    try {
      await rejectParticipant(sessionId, registrationId);
    } catch (err: any) {
      setActionError({ id: sessionId, msg: err.message || 'Error al rechazar participante' });
    } finally {
      setParticipantActionLoadingId(null);
    }
  };

  const handleRemoveParticipant = async (sessionId: number, registrationId: number) => {
    setParticipantActionLoadingId(registrationId);
    setActionError(null);
    try {
      await removeParticipant(sessionId, registrationId);
    } catch (err: any) {
      setActionError({ id: sessionId, msg: err.message || 'Error al eliminar participante' });
    } finally {
      setParticipantActionLoadingId(null);
    }
  };
  
  const [formData, setFormData] = useState({
    subject_id: "",
    title: "",
    description: "",
    type: "virtual" as "virtual" | "presencial",
    meeting_link: "",
    location: "",
    date_time: "",
    duration_hours: 1,
    duration_minutes: 0,
    max_slots: "",
    approval_required: false,
  });

  useEffect(() => {
    const loadSubjectsForActivePlan = async () => {
      if (!user?.id) {
        setSubjects([]);
        return;
      }

      try {
        setSubjectLoadError(null);
        const enrollments = await getEnrollments(user.id);
        const activeEnrollment =
          enrollments.find((e) => e.isActive && e.studyPlanId) ||
          enrollments.find((e) => e.studyPlanId);

        if (!activeEnrollment) {
          setSubjects([]);
          return;
        }

        const planSubjects = await getStudentPlanSubjects(String(user.id), String(activeEnrollment.id));
        const normalizedSubjects: SubjectOption[] = planSubjects
          .map((s) => ({ id: Number(s.id), name: s.name }))
          .filter((s) => Number.isFinite(s.id));

        const seenIds = new Set<number>();
        const deduplicatedSubjects = normalizedSubjects.filter(s => {
          if (seenIds.has(s.id)) return false;
          seenIds.add(s.id);
          return true;
        });
        setSubjects(deduplicatedSubjects);

        const allSubjects = await getSubjects();
        const unahurFiltered: SubjectOption[] = allSubjects
          .filter((s: any) => s.is_unahur)
          .map((s: any) => ({ id: Number(s.id), name: s.name }))
          .filter((s) => Number.isFinite(s.id));
        setUnahurSubjects(unahurFiltered);
      } catch (err: any) {
        setSubjects([]);
        setSubjectLoadError(err?.message || "No se pudieron cargar las materias del plan activo.");
      }
    };

    loadSubjectsForActivePlan();

    (async () => {
      if (!user?.id) return;
      try {
        const records = await getAcademicRecords(user.id);
        const ids = new Set<string>((Array.isArray(records) ? records : []).map((r) => r.subjectId).filter(Boolean));
        setAcademicRecordSubjectIds(ids);
      } catch {
        setAcademicRecordSubjectIds(new Set());
      }
    })();
  }, [user?.id]);

  const filteredSubjects = isUnahur ? unahurSubjects : subjects;

  const sidebarSubjects = academicRecordSubjectIds.size > 0
    ? subjects.filter((s) => academicRecordSubjectIds.has(String(s.id)))
    : subjects;

  useEffect(() => {
    if (isModalOpen) setStep(1);
  }, [isModalOpen]);

  const step1Valid = formData.title.trim() !== "" && formData.subject_id !== "";

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.subject_id) return setFormError("Por favor, seleccioná una materia.");
    if (!formData.title.trim()) return setFormError("El título de la sesión es obligatorio.");
    if (!formData.date_time) return setFormError("La fecha y hora son obligatorias.");
    if (new Date(formData.date_time) <= new Date()) return setFormError("La fecha de la sesión no puede ser en el pasado.");
    if (formData.duration_hours === 0 && formData.duration_minutes === 0) return setFormError("La duración debe ser mayor a 0.");
    if (formData.type === 'presencial' && !formData.location?.trim()) return setFormError("La ubicación es obligatoria para sesiones presenciales.");

    let meetingLink = formData.meeting_link;
    if (formData.type === 'virtual') {
      const rawLink = formData.meeting_link?.trim() ?? '';
      if (!rawLink) return setFormError("El enlace de la reunión es obligatorio para sesiones virtuales.");
      let normalizedLink = rawLink;
      if (!/^https?:\/\//i.test(normalizedLink)) normalizedLink = 'https://' + normalizedLink;
      try { new URL(normalizedLink); }
      catch { return setFormError("El enlace debe ser una URL válida (ej: https://meet.google.com/abc)"); }
      meetingLink = normalizedLink;
    }

    try {
      setIsSubmitting(true);
      await createSession({
        ...formData,
        meeting_link: meetingLink,
        subject_id: Number(formData.subject_id),
        duration_hours: Number(formData.duration_hours),
        duration_minutes: Number(formData.duration_minutes),
        max_slots: formData.max_slots ? Number(formData.max_slots) : null,
      });
      setIsModalOpen(false);
      setFormData({
        subject_id: "", title: "", description: "", type: "virtual" as "virtual" | "presencial", meeting_link: "", location: "", date_time: "", duration_hours: 1, duration_minutes: 0, max_slots: "", approval_required: false,
      });
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUserId = user ? parseInt(user.id, 10) : 0;

  const filteredSessions = sessions.filter(session => {
    if (session.status === 'cancelada') return false;
    if (hideFull && session.max_slots !== null) {
      const approvedCount = session.registrations?.filter(r => r.status === 'approved').length ?? 0;
      if (approvedCount >= session.max_slots) return false;
    }
    if (filterEnrollment === 'todos') return true;
    const reg = session.registrations?.find(r => r.student_id === currentUserId);
    const isHost = session.host_student_id === currentUserId;
    if (filterEnrollment === 'inscripto') return !!reg && reg.status !== 'rejected';
    if (filterEnrollment === 'propios') return isHost;
    if (filterEnrollment === 'no_inscripto') return !isHost && !reg;
    return true;
  });

  if (isLoading && !sessions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-on-surface-variant">Cargando sesiones...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          className="mb-lg"
          eyebrow="Tutoria estudiantil"
          title="Sesiones de estudio"
          actions={
            <Button data-tour="sessions-create" variant="primary" onClick={() => setIsModalOpen(true)}>
              <span className="material-symbols-outlined text-[24px]">add</span>
              Crear sesión
            </Button>
          }
        />

        <div className="grid grid-cols-12 gap-gutter">
          {/* Sidebar de filtros */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card data-tour="sessions-subjects-filter" headerClassName="py-3"
              header={
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
                  <h3 className="font-title-sm text-title-sm text-on-surface">Materias</h3>
                </div>
              }
            >
              <div>
                <InputSelect value={filterSubjectId} onChange={e => setFilterSubjectId(e.target.value)}>
                  <option value="">Todas las materias</option>
                  {sidebarSubjects.map((s, i) => <option key={`${s.id}_${i}`} value={String(s.id)}>{s.name}</option>)}
                </InputSelect>
              </div>
            </Card>

            <Card data-tour="sessions-filters" headerClassName="py-3"
              header={
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">filter_list</span>
                  <h3 className="font-title-sm text-title-sm text-on-surface">Filtros</h3>
                </div>
              }
              footer={
                <div className="space-y-2 flex flex-col gap-3">
                <InputToggle
                  label="Solo inscriptos"
                  checked={filterEnrollment === "inscripto"}
                  onChange={(checked) => setFilterEnrollment(checked ? "inscripto" : "todos")}
                />
                <InputToggle
                  label="Propios"
                  checked={filterEnrollment === "propios"}
                  onChange={(checked) => setFilterEnrollment(checked ? "propios" : "todos")}
                />
                <InputToggle
                  label="Ocultar sin cupos"
                  checked={hideFull}
                  onChange={setHideFull}
                />
                </div>
              }
            >
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "", label: "Todas" },
                  { value: "virtual", label: "Virtual" },
                  { value: "presencial", label: "Presencial" },
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={filterType === opt.value ? "primary" : "secondary"}
                    onClick={() => setFilterType(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-9 space-y-4">
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`font-body-sm text-body-sm text-on-surface-variant pe-2 ${filterSubjectId === "" && filterType === "" && filterEnrollment === "todos" && !hideFull ? "invisible" : ""}`}>Filtros activos:</span>

              {filterSubjectId !== "" && (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setFilterSubjectId("")}>
                  <Tag variant="positive">{subjects.find(s => String(s.id) === filterSubjectId)?.name}</Tag>
                  <button onClick={(e) => { e.stopPropagation(); setFilterSubjectId(""); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              )}

              {filterType !== "" && (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setFilterType("")}>
                  <Tag variant="info">Modalidad {filterType}</Tag>
                  <button onClick={(e) => { e.stopPropagation(); setFilterType(""); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              )}

              {filterEnrollment === "inscripto" && (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setFilterEnrollment("todos")}>
                  <Tag variant="info">Mostrar inscriptos</Tag>
                  <button onClick={(e) => { e.stopPropagation(); setFilterEnrollment("todos"); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              )}

              {filterEnrollment === "propios" && (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setFilterEnrollment("todos")}>
                  <Tag variant="info">mostrar propios</Tag>
                  <button onClick={(e) => { e.stopPropagation(); setFilterEnrollment("todos"); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              )}

              {hideFull && (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setHideFull(false)}>
                  <Tag variant="neutral">Ocultar sin cupos</Tag>
                  <button onClick={(e) => { e.stopPropagation(); setHideFull(false); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              )}

              {(filterSubjectId !== "" || filterType !== "" || filterEnrollment !== "todos" || hideFull) && (
                <div className="flex items-center gap-1 group cursor-pointer" onClick={() => { setFilterSubjectId(""); setFilterType(""); setFilterEnrollment("todos"); setHideFull(false); }}>
                  <Tag variant="warning">Limpiar filtros</Tag>
                  <span className="material-symbols-outlined text-[20px] group-hover:text-amber-500">restart_alt</span>
                </div>
              )}
            </div>
            {error && (
              <div className="rounded-lg bg-error-container/30 border border-error/50 p-3 text-error text-sm flex items-start gap-2">
                <span className="material-symbols-outlined flex-shrink-0 text-lg">error</span>
                <span>{error}</span>
              </div>
            )}
            {subjectLoadError && (
              <div className="rounded-lg bg-error-container/30 border border-error/50 p-3 text-error text-sm flex items-start gap-2">
                <span className="material-symbols-outlined flex-shrink-0 text-lg">error</span>
                <span>{subjectLoadError}</span>
              </div>
            )}

            <div data-tour="sessions-list">
            {sessions.length === 0 ? (
              <EmptyState>No hay sesiones disponibles en este momento.</EmptyState>
            ) : filteredSessions.length === 0 ? (
              <EmptyState>No hay sesiones que coincidan con los filtros.</EmptyState>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                {filteredSessions.map((session) => {
              const isHost = session.host_student_id === currentUserId;
              const registration = session.registrations?.find(r => r.student_id === currentUserId);
              const isJoined = !!registration;
              const isApproved = registration?.status === 'approved';
              const isPending = registration?.status === 'pending';
              
              const approvedCount = session.registrations?.filter(r => r.status === 'approved').length || 0;
              const isFull = session.max_slots !== null && approvedCount >= session.max_slots;

              return (
                <Card
                  key={session.id}
                  className="hover:shadow-md transition-shadow"
                  headerVariant="white"
                  header={
                    <>
                      <div className="flex items-center justify-between">
                        <Tag variant={session.type === "virtual" ? "info" : "positive"}>{session.type === 'virtual' ? 'Virtual' : 'Presencial'}</Tag>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {new Date(session.date_time).toLocaleString([], {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <h4 className="font-title-sm text-title-xs text-on-surface mt-2">{session.subject?.name}</h4>
                    </>
                  }
                  headerClassName="px-5 py-3"
                  bodyClassName="px-5 py-3 flex flex-col"
                >
                  <h5 className="font-title-md text-title-sm font-bold text-on-surface">{session.title}</h5>
                  {session.description && (
                    <p className="text-xs font-body-sm text-on-surface-variant line-clamp-1 mt-2">{session.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs mt-3 text-on-surface-variant flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined w-[16px] text-[16px]">schedule</span>
                      <span className="whitespace-nowrap">
                        {session.duration_hours}h {session.duration_minutes > 0 ? `${session.duration_minutes}m` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined w-[16px] text-[16px]">group</span>
                      <span className="whitespace-nowrap">
                        {session.max_slots !== null ? `${approvedCount} / ${session.max_slots}` : "Ilimitados"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined w-[16px] text-[16px] shrink-0">
                        {session.type === 'virtual' ? 'link' : 'location_on'}
                      </span>
                      {session.type === 'virtual' && session.meeting_link ? (
                        <a href={session.meeting_link} target="_blank" rel="noreferrer"
                          className="break-all cursor-pointer hover:underline text-primary">
                          {session.meeting_link}
                        </a>
                      ) : (
                        <span className="break-all">
                          {session.type === 'virtual' ? 'Enlace pendiente' : session.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs mt-3 text-on-surface-variant">
                    <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed uppercase">
                      {(session.host?.User?.name ? session.host.User.name[0] : "U")}
                    </div>
                    <span>
                      {session.host?.User?.name} {session.host?.User?.lastname}
                      {isHost && <span className="font-semibold text-primary"> (Tú)</span>}
                    </span>
                  </div>

                  <div className="border-t border-outline-variant pt-3 mt-3 space-y-2">
                    {actionError?.id === session.id && (
                      <p className="text-xs text-error">{actionError.msg}</p>
                    )}

                    {isHost ? (
                      session.approval_required ? (
                        <div className="flex gap-2">
                          <Button variant="primary" className="flex-1" onClick={() => setShowRequestsModal(session.id)}
                            disabled={(session.registrations?.filter(r => r.status === 'pending').length ?? 0) === 0}>
                            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                            Ver solicitudes ({session.registrations?.filter(r => r.status === 'pending').length ?? 0})
                          </Button>
                          <Button variant="danger" onClick={() => setConfirmDeleteId(session.id)}>
                            <span className="material-symbols-outlined text-[24px]">delete</span>
                          </Button>
                        </div>
                      ) : (
                        <Button variant="danger" className="w-full" onClick={() => setConfirmDeleteId(session.id)}>
                          <span className="material-symbols-outlined text-[24px]">delete</span>
                          Cancelar sesión
                        </Button>
                      )
                    ) : isFull ? (
                      <Button variant="ghost" className="w-full" disabled>
                        <span className="material-symbols-outlined text-[24px]">event_busy</span>
                        Cupos agotados
                      </Button>
                    ) : isPending ? (
                      <Button variant="secondary" className="w-full" onClick={() => handleLeave(session.id)} disabled={actionLoadingId === session.id}>
                        <span className="material-symbols-outlined text-[24px]">close</span>
                        Cancelar solicitud
                      </Button>
                    ) : isJoined ? (
                      <Button variant="secondary" className="w-full" onClick={() => handleLeave(session.id)} disabled={actionLoadingId === session.id}>
                        <span className="material-symbols-outlined text-[24px]">exit_to_app</span>
                        Abandonar
                      </Button>
                    ) : session.approval_required ? (
                      <Button variant="primary" className="w-full" onClick={() => handleJoin(session.id)}>
                        <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
                        Solicitar unirse
                      </Button>
                    ) : (
                      <Button variant="primary" className="w-full" onClick={() => handleJoin(session.id)}>
                        <span className="material-symbols-outlined text-[24px]">add</span>
                        Unirse
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
            </div>
      </div>
      </div>
      </div>

      <ProductTour tourId="sessions" steps={sessionsTourSteps} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={step === 1 ? "Crear Sesión de Estudio" : "Configurar Sesión"}
        size="lg"
        footer={
          step === 1 ? (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setIsModalOpen(false); setFormError(null); }}>
                <span className="material-symbols-outlined">close</span>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1" disabled={!step1Valid} onClick={() => setStep(2)}>
                <span className="material-symbols-outlined">arrow_forward</span>
                Siguiente
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                <span className="material-symbols-outlined">arrow_back</span>
                Anterior
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleCreate} disabled={isSubmitting}>
                <span className="material-symbols-outlined">check</span>
                {isSubmitting ? 'Creando...' : 'Crear Sesión'}
              </Button>
            </div>
          )
        }
      >
        <form className="flex flex-col gap-4">
          {step === 1 ? (
            <Form>
              <Form.Row cols={1}>
                <Form.Field label="Título" required>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej: Repaso para el parcial" />
                </Form.Field>
              </Form.Row>
              <Form.Row cols={1}>
                <Form.Field label="Descripción">
                  <textarea placeholder="Detalles sobre los temas a estudiar..." className="w-full bg-surface-bright border border-outline-variant rounded px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </Form.Field>
              </Form.Row>
              <Form.Row cols={2} className="grid-cols-1 sm:grid-cols-[1fr_auto]">
                <Form.Field label="Materia" required>
                  <InputSelect value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: Number(e.target.value)})} disabled={subjects.length === 0 && unahurSubjects.length === 0}>
                    <option value="">{subjects.length === 0 && unahurSubjects.length === 0 ? "Sin materias disponibles" : "Seleccionar materia..."}</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </InputSelect>
                  {subjects.length === 0 && unahurSubjects.length === 0 && (
                    <p className="mt-1 text-xs text-on-surface-variant">Necesitás una inscripción activa con plan de estudio para crear sesiones.</p>
                  )}
                </Form.Field>
                <Form.Field label="Filtrar" className="gap-5">
                  <InputToggle checked={isUnahur} onChange={setIsUnahur} description="Es materia UNaHUR" disabled={unahurSubjects.length === 0} />
                </Form.Field>
              </Form.Row>
            </Form>
          ) : (
            <>
              {formError && <FormError message={formError} className="mb-0" />}
              <Form>
              <Form.Row cols={2}>
                <Form.Field label="Modalidad" required>
                  <InputSelect value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as "virtual" | "presencial"})}>
                    <option value="virtual">Virtual</option>
                    <option value="presencial">Presencial</option>
                  </InputSelect>
                </Form.Field>
                <Form.Field label="Fecha y Hora" required>
                  <Input type="datetime-local" value={formData.date_time} onChange={e => setFormData({...formData, date_time: e.target.value})} />
                </Form.Field>
              </Form.Row>
              <Form.Row cols={1}>
                <Form.Field label={formData.type === 'virtual' ? "Enlace (Meet, Zoom, etc)" : "Ubicación"} required>
                  <Input value={formData.type === 'virtual' ? formData.meeting_link : formData.location} onChange={e => setFormData({...formData, [formData.type === 'virtual' ? 'meeting_link' : 'location']: e.target.value})} placeholder={formData.type === 'virtual' ? "https://..." : "Ej: Biblioteca"} />
                </Form.Field>
              </Form.Row>
              <Form.Row cols={2}>
                <Form.Field label="Duración (Horas)" required>
                  <Input type="number" min="0" value={formData.duration_hours} onChange={e => setFormData({...formData, duration_hours: Number(e.target.value)})} />
                </Form.Field>
                <Form.Field label="Minutos">
                  <Input type="number" min="0" max="59" step="15" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} />
                </Form.Field>
              </Form.Row>
              <Form.Row cols={2} >
                <Form.Field label="Cupos máximos">
                  <Input type="number" min="1" value={formData.max_slots} onChange={e => setFormData({...formData, max_slots: e.target.value})} placeholder="Ilimitado" />
                </Form.Field>
                <Form.Field label="Requiere Aprobación Manual" className="gap-5">
                  <InputToggle checked={formData.approval_required} onChange={(checked) => setFormData({...formData, approval_required: checked})} />
                </Form.Field>
              </Form.Row>
            </Form>
            </>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) cancelSession(confirmDeleteId); setConfirmDeleteId(null); }}
        title="Cancelar sesión"
        description="¿Cancelar esta sesión? Se notificará a los inscriptos."
        confirmLabel="Sí, cancelar"
        cancelLabel="No, volver"
        variant="danger"
      />

      <Modal
        isOpen={showRequestsModal !== null}
        onClose={() => setShowRequestsModal(null)}
        title="Solicitudes pendientes"
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRequestsModal(null)}>
              <span className="material-symbols-outlined">close</span>
              Cerrar
            </Button>
            {(() => {
              const session = sessions.find(s => s.id === showRequestsModal);
              const pending = session?.registrations?.filter(r => r.status === 'pending') ?? [];
              const approvedCount = session?.registrations?.filter(r => r.status === 'approved').length ?? 0;
              return pending.length > 0 && (
                <Button variant="primary" className="flex-1"
                  disabled={session?.max_slots !== null && approvedCount + pending.length > session.max_slots}
                  onClick={() => {
                    pending.forEach(reg => handleApproveParticipant(session!.id, reg.id));
                    setShowRequestsModal(null);
                  }}>
                  <span className="material-symbols-outlined">how_to_reg</span>
                  Aceptar todos
                </Button>
              );
            })()}
          </div>
        }
      >
        <div className="space-y-2 overflow-y-auto">
          {(() => {
            const session = sessions.find(s => s.id === showRequestsModal);
            const pending = session?.registrations?.filter(r => r.status === 'pending') ?? [];
            return pending.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No hay solicitudes pendientes.</p>
            ) : pending.map(reg => (
              <div key={reg.id} className="flex items-center justify-between border border-slate-100 px-5 py-1.5 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed uppercase">
                    {reg.student?.User?.name ? reg.student.User.name[0] : "?"}
                  </div>
                  <span className="text-on-surface">
                    {reg.student?.User?.name} {reg.student?.User?.lastname}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="primary" onClick={() => session && handleApproveParticipant(session.id, reg.id)} title="Aceptar">
                    <span className="material-symbols-outlined text-[24px]">check</span>
                  </Button>
                  <Button variant="danger" onClick={() => session && handleRejectParticipant(session.id, reg.id)} title="Rechazar">
                    <span className="material-symbols-outlined text-[24px]">close</span>
                  </Button>
                </div>
              </div>
            ));
          })()}
        </div>
      </Modal>
    </div>
  );
}
