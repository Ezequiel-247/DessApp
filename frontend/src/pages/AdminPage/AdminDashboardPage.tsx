import { useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { SegmentedControl } from "@/widgets/ui/SegmentedControl";
import { useReports, SummarySection, MaterialsTable, TopRatedSection, ActiveCareersSection, ActiveUsersSection, SubjectsApprovedByStudentSection, SubjectsApprovedByCareerSection, SubjectsByCareerSection, SubjectsByStudentSection, StudySessionsUsageSection, SocialConnectionsSection, ModerationStatsSection } from "@/features/reports";

const TAB_OPTIONS = [
  { value: "general", label: "General" },
  { value: "usuarios", label: "Usuarios" },
  { value: "por-materia", label: "Por Materia" },
  { value: "valorados", label: "Mejor Valorados" },
  { value: "aprobadas", label: "Aprobadas" },
  { value: "cursadas", label: "Cursadas" },
  { value: "sesiones", label: "Sesiones" },
  { value: "comunidad", label: "Comunidad" },
];

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { rows, topRated, summary, moderation, loading, error, retry } = useReports();

  return (
    <div className="space-y-gutter">
      <PageHeader
        eyebrow="Administración"
        title="Dashboard"
      />

      <div className="w-full overflow-x-auto pb-2">
        <SegmentedControl value={activeTab} onChange={setActiveTab} options={TAB_OPTIONS} className="flex-shrink-0" />
      </div>


      {loading ? (
        <div className="flex items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando dashboard...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <span className="material-symbols-outlined text-[48px] text-error">error_outline</span>
          <p className="text-body-md text-on-surface-variant text-center max-w-md">{error}</p>
          <button
            onClick={retry}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold hover:brightness-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
          </button>
        </div>
      ) : (
        <>
          {activeTab === "general" && <SummarySection rows={rows} topRated={topRated} summary={summary} />}
          {activeTab === "usuarios" && <ActiveUsersSection />}
          {activeTab === "por-materia" && <MaterialsTable />}
          {activeTab === "valorados" && <TopRatedSection />}
          {activeTab === "aprobadas" && (
            <div className="space-y-gutter">
              <SubjectsApprovedByCareerSection />
              <SubjectsApprovedByStudentSection />
            </div>
          )}
          {activeTab === "cursadas" && (
            <div className="space-y-gutter">
              <SubjectsByCareerSection />
              <SubjectsByStudentSection />
            </div>
          )}
          {activeTab === "sesiones" && <StudySessionsUsageSection />}
          {activeTab === "comunidad" && (
            <div className="space-y-gutter">
              <SocialConnectionsSection />
              <ModerationStatsSection stats={moderation} />
              <ActiveCareersSection />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
