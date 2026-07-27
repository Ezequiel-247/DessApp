/**
 * DashboardPage - Panel principal del estudiante
 * Nexo - Stitch Design System
 */
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useMyProgress } from "@/features/my-progress";
import { useConnections } from "@/features/connections";
import { useAcademicRecord } from "@/features/academic-record";
import { useSessions } from "@/features/sessions/hooks/useSessions";
import { useAuth } from "@/app/AuthContext";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "@/shared/lib/resolveMediaUrl";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { ProductTour, type TourStep } from "@/features/onboarding";

const dashboardTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "¡Bienvenido a Nexo!",
    content: "Te mostramos rápidamente las secciones principales del Resumen. Podés salir cuando quieras.",
  },
  {
    target: '[data-tour="db-progress"]',
    title: "Progreso de Carrera",
    content: "Acá ves tu avance actualizado en tiempo real: porcentaje completado, promedio actual y materias pendientes.",
  },
  {
    target: '[data-tour="db-sessions-add"]',
    title: "Crear sesión de estudio",
    content: "Con este botón podés organizar una nueva sesión de estudio.",
  },
  {
    target: '[data-tour="db-sessions-list"]',
    title: "Próximas sesiones",
    content: "Acá vas a ver las sesiones de estudio en las que participás, ordenadas por fecha.",
  },
  {
    target: '[data-tour="db-history"]',
    title: "Historial académico",
    content: "Este botón te lleva a tu historial completo de notas, finales y actividades.",
  },
  {
    target: '[data-tour="db-connections"]',
    title: "Tus conexiones",
    content: "Y acá podés ver y gestionar tus conexiones con otros estudiantes.",
  },
];

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { profile, isLoading: isProfileLoading, error: profileError } = useProfile();
  const { data: myProgressData, isLoading: isMyProgressLoading, error: myProgressError } = useMyProgress();
  const { connections, isLoading: isConnectionsLoading } = useConnections();
  const { displayRows, isLoading: isRecordsLoading } = useAcademicRecord();
  const { sessions, isLoading: isSessionsLoading } = useSessions();

  // Datos reales del progreso académico (mismo cálculo que "Avance General" en Mi Progreso)
  const progressPercentage = myProgressData?.progressPercent ?? 0;

  // Cálculo del promedio actual (promedio simple sin contar créditos)
  const validGrades = displayRows
    .map((row) => parseFloat(String(row.grade)))
    .filter((g) => !isNaN(g)); // Solo nos quedamos con las notas numéricas válidas

  const currentAverageValue = validGrades.length > 0
    ? (validGrades.reduce((acc, val) => acc + val, 0) / validGrades.length).toFixed(2)
    : "0.00";

  const pendingSubjectsCount = myProgressData
    ? Math.max(myProgressData.totalUnits - myProgressData.completedUnits, 0)
    : 0;

  const acceptedConnections = connections.filter((c) => c.status === 'accepted').slice(0, 5); // Mostramos hasta 5

  // Historial académico reciente (hasta 5) ordenado por año y cuatrimestre descendente
  const recentRecords = [...displayRows]
    .sort((a, b) => (b.year - a.year) || ((b.semester || 0) - (a.semester || 0)))
    .slice(0, 5);

  // Lógica para filtrar Próximas Sesiones reales
  const currentUserId = user ? parseInt(user.id, 10) : 0;
  const upcomingSessions = sessions
    .filter(session => {
      // Descartar canceladas y pasadas
      if (session.status === 'cancelada') return false;
      const sessionDate = new Date(session.date_time);
      if (sessionDate < new Date()) return false;

      // Quedarse solo con las que el usuario organiza o en las que está inscripto y aceptado
      const isHost = session.host_student_id === currentUserId;
      const reg = session.registrations?.find(r => r.student_id === currentUserId);
      const isApprovedParticipant = !!reg && reg.status === 'approved';

      return isHost || isApprovedParticipant;
    })
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()) // Ordenar más próximas primero
    .slice(0, 3); // Mostrar solo las próximas 3

  const greeting = profile?.name ? `Hola, ${profile.name}` : "Hola";
  const careerLabel = profile?.careerName || "Cargando...";

  const isLoading = isProfileLoading || isMyProgressLoading;
  const error = profileError || myProgressError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-on-surface-variant">Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-error">{typeof error === 'string' ? error : "Error al cargar el dashboard"}</span>
      </div>
    );
  }

  return (
    <>
      {/* Greeting */}
      <PageHeader
        className="mb-gutter"
        title={greeting}
        titleClassName="font-headline-md text-headline-md text-on-surface mb-1"
        description="Aquí tienes el resumen de tu actividad académica."
        descriptionClassName="mt-0 font-body-md text-body-md text-on-surface-variant"
      />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

        {/* Progreso Académico (Bento Main) */}
        <SectionCard data-tour="db-progress" className="lg:col-span-8" bodyClassName="p-gutter flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-title-sm text-title-sm text-on-surface">
                Progreso de Carrera
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {careerLabel}
              </p>
            </div>
            <span className="bg-surface-container px-3 py-1 rounded-full font-label-caps text-label-caps text-primary-container">
              EN CURSO
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
            {/* Circular Progress */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-surface-variant"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-primary-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${progressPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-primary-container leading-none">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="bg-surface-container-low p-4 rounded-lg">
                <div className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                  PROMEDIO ACTUAL
                </div>
                <div className="font-title-sm text-title-sm text-on-surface">
                  {currentAverageValue}
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg">
                <div className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                  MATERIAS PENDIENTES
                </div>
                <div className="font-title-sm text-title-sm text-on-surface">
                  {pendingSubjectsCount}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Próximas Sesiones (Datos Reales) */}
        <SectionCard className="lg:col-span-4" bodyClassName="p-gutter flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-sm text-title-sm text-on-surface">
              Próximas Sesiones
            </h3>
            <button
              data-tour="db-sessions-add"
              onClick={() => navigate('/student/sessions')}
              className="text-primary-container hover:bg-surface-container p-1 rounded transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div data-tour="db-sessions-list" className="flex flex-col gap-4 flex-1">
            {isSessionsLoading ? (
               <p className="text-body-sm text-on-surface-variant text-center py-4">Cargando sesiones...</p>
            ) : upcomingSessions.length === 0 ? (
               <div className="flex flex-col items-center text-center py-6">
                 <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">event_busy</span>
                 <p className="text-body-sm text-on-surface-variant">No tienes sesiones próximas.</p>
               </div>
            ) : (
              upcomingSessions.map((session) => {
                const date = new Date(session.date_time);
                const dayLabel = date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
                const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div
                    key={session.id}
                    className="flex gap-4 p-3 rounded-lg border border-outline-variant hover:border-primary-container transition-colors cursor-pointer group"
                    onClick={() => navigate('/student/sessions')}
                  >
                    <div className="flex flex-col items-center justify-center bg-surface-container-low rounded-lg p-2 min-w-[50px] group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                      <span className="font-label-caps text-label-caps">{dayLabel}</span>
                      <span className="font-title-sm text-title-sm">{timeStr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-body-sm text-body-sm font-semibold text-on-surface truncate">
                        {session.title}
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-xs flex items-center gap-1 mt-1 truncate">
                        <span className="material-symbols-outlined text-[14px] shrink-0">
                          {session.type === 'virtual' ? 'videocam' : 'location_on'}
                        </span>
                        <span className="truncate">
                          {session.subject?.name || (session.type === 'virtual' ? 'Virtual' : 'Presencial')}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button 
            onClick={() => navigate('/student/sessions')}
            className="mt-4 w-full py-2 font-label-caps text-label-caps text-primary-container border border-primary-container rounded hover:bg-primary-container hover:text-on-primary transition-colors"
          >
            VER TODAS LAS SESIONES
          </button>
        </SectionCard>

        {/* Historial Académico Reciente (Tabla) */}
        <SectionCard
          className="lg:col-span-8"
          header={
            <div className="flex justify-between items-center">
              <h3 className="font-title-sm text-title-sm text-on-surface">
                Últimos Registros Académicos
              </h3>
              <button
                data-tour="db-history"
                onClick={() => navigate('/student/academic-record')}
                className="font-body-sm text-body-sm text-primary hover:underline"
              >
                Ver historial completo
              </button>
            </div>
          }
        >
          {isRecordsLoading ? (
            <div className="py-8 px-6 text-center text-on-surface-variant">Cargando historial...</div>
          ) : recentRecords.length === 0 ? (
            <div className="py-8 px-6 text-center text-on-surface-variant">No tienes registros académicos aún.</div>
          ) : (
            <>
              {/* Mobile/tablet (<lg): cards, sin scroll horizontal — misma razón que
                  AcademicRecordTable: una tabla de 5 columnas no entra cómoda antes de
                  ~1024px, forzar el scroll horizontal ahí es justo lo que se evalúa mal. */}
              <div className="divide-y divide-outline-variant/50 lg:hidden">
                {recentRecords.map((record) => (
                  <div key={`${record._type}_${record.id}`} className="flex flex-col gap-2 py-4 px-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 font-medium text-on-surface">
                        {record.subjectName || "Materia desconocida"}
                        {record._type === "exam" && (
                          <span className="ml-1 inline-block rounded-full bg-surface-container px-1.5 py-0.5 font-label-caps text-[10px] text-on-surface-variant">Examen</span>
                        )}
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        record.status === "approved" || record.status === "aprobado" ? "bg-secondary-container text-on-secondary-container" :
                        record.status === "failed" || record.status === "desaprobado" ? "bg-error-container/30 text-error" :
                        record.status === "enrolled" ? "bg-info-container text-on-info-container" :
                        "bg-tertiary-fixed-dim text-on-tertiary-fixed"
                      }`}>
                        {record.status === "approved" || record.status === "aprobado" ? "Aprobada" :
                         record.status === "failed" || record.status === "desaprobado" ? "Desaprobada" :
                         record.status === "enrolled" ? "En curso" : "Pendiente"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                      <span>{record.year} · {record.semester === 2 ? "2do" : "1er"} cuatrimestre</span>
                      <span className="font-semibold text-on-surface">Nota: {record.grade ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop (>=lg): tabla clásica */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant">
                      <th className="py-3 px-6 font-semibold">MATERIA</th>
                      <th className="py-3 px-6 font-semibold text-center">AÑO</th>
                      <th className="py-3 px-6 font-semibold text-center">NOTA</th>
                      <th className="py-3 px-6 font-semibold text-center">CUAT.</th>
                      <th className="py-3 px-6 font-semibold text-center">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm text-on-surface">
                    {recentRecords.map((record, index) => (
                      <tr
                        key={`${record._type}_${record.id}`}
                        className={`border-b border-outline-variant/50 hover:bg-surface transition-colors ${index % 2 === 1 ? "bg-surface/30" : ""}`}
                      >
                        <td className="py-4 px-6 font-medium text-on-surface">
                          {record.subjectName || "Materia desconocida"}
                          {record._type === "exam" && (
                            <span className="ml-2 inline-block rounded-full bg-surface-container px-1.5 py-0.5 font-label-caps text-[10px] text-on-surface-variant">Examen</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center text-on-surface-variant">{record.year}</td>
                        <td className="py-4 px-6 text-center font-semibold">{record.grade ?? "-"}</td>
                        <td className="py-4 px-6 text-center text-on-surface-variant">{record.semester === 2 ? "2do" : "1er"}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            record.status === "approved" || record.status === "aprobado" ? "bg-secondary-container text-on-secondary-container" :
                            record.status === "failed" || record.status === "desaprobado" ? "bg-error-container/30 text-error" :
                            record.status === "enrolled" ? "bg-info-container text-on-info-container" :
                            "bg-tertiary-fixed-dim text-on-tertiary-fixed"
                          }`}>
                            {record.status === "approved" || record.status === "aprobado" ? "Aprobada" :
                             record.status === "failed" || record.status === "desaprobado" ? "Desaprobada" :
                             record.status === "enrolled" ? "En curso" : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionCard>

        {/* Mis Conexiones */}
        <SectionCard className="lg:col-span-4" bodyClassName="p-gutter flex flex-col">
          <h3 className="font-title-sm text-title-sm text-on-surface mb-4">
            Mis Conexiones
          </h3>
          <div className="flex flex-col gap-4 flex-1">
            {isConnectionsLoading ? (
              <p className="text-body-sm text-on-surface-variant">Cargando conexiones...</p>
            ) : acceptedConnections.length === 0 ? (
              <div className="flex flex-col items-center text-center py-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">people_outline</span>
                <p className="text-body-sm text-on-surface-variant">No tienes amigos conectados aún.</p>
              </div>
            ) : (
              acceptedConnections.map((connection) => {
                const avatarSrc = resolveMediaUrl(connection.userImage);
                return (
                  <div key={connection.id} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-semibold text-xs">
                      {avatarSrc ? (
                        <img
                          alt={`Avatar de ${connection.userName}`}
                          className="w-full h-full object-cover"
                          src={avatarSrc}
                        />
                      ) : (
                        getInitials(connection.userName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm text-body-sm text-on-surface font-semibold truncate">
                        {connection.userName}
                      </p>
                      <p className="font-body-sm text-body-sm text-xs text-on-surface-variant truncate">
                        {connection.userEmail}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button
            data-tour="db-connections"
            onClick={() => navigate('/student/connections')}
            className="mt-4 w-full py-2 font-label-caps text-label-caps text-primary-container border border-primary-container rounded hover:bg-primary-container hover:text-on-primary transition-colors"
          >
            VER CONEXIONES
          </button>
        </SectionCard>
      </div>

      <ProductTour tourId="dashboard" steps={dashboardTourSteps} />
    </>
  );
}