import { useCallback, useEffect, useRef } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { YearNavSidebar } from "@/features/myPlanner/customPlan/components/YearNavSidebar";
import { TimelineContent } from "@/features/myPlanner/customPlan/components/TimelineContent";
import { SetupModal } from "@/features/myPlanner/components/SetupModal";
import { SavePlanModal } from "@/features/myPlanner/customPlan/components/SavePlanModal";
import { DeletePlanModal } from "@/features/myPlanner/customPlan/components/DeletePlanModal";
import { SabbaticalModal } from "@/features/myPlanner/customPlan/components/SabbaticalModal";
import { ElectiveModal } from "@/features/myPlanner/customPlan/components/ElectiveModal";
import { UnahurModal } from "@/features/myPlanner/customPlan/components/UnahurModal";
import { PlannerActions } from "@/features/myPlanner/components/PlannerActions";
import { FloatingAddButton } from "@/features/myPlanner/components/FloatingAddButton";
import type {
  SavedPlan,
  Plan,
  SubjectGraph,
  SubjectClassification,
} from "@/features/myPlanner/customPlan/model/planner";
import type { SabbaticalPeriod } from "@/features/myPlanner/customPlan/services/sabbaticalService";
import type { ElectiveBlock, ElectiveChoice } from "@/features/myPlanner/customPlan/services/electiveChoiceService";
import type { UnahurBlock, UnahurChoice } from "@/features/myPlanner/customPlan/services/unahurChoiceService";

interface Props {
  data: Plan;
  activeYear: number;
  onYearVisible: (year: number) => void;
  moveSubject: (
    subjectId: string,
    sourceYear: number,
    sourceSem: number,
    targetYear: number,
    targetSem: number,
    onError?: (error: string) => void,
  ) => void;
  moveFinalEvent: (
    academicRecordId: number,
    finalExamId: number | undefined,
    targetYear: number,
    targetTerm: number,
    onError?: (error: string) => void,
  ) => void;
  studentId: string | undefined;
  hoursLimit: number;
  readOnly: boolean;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  onCancelEdit: () => void;
  activePlanName: string;
  plans: SavedPlan[];
  activePlanId: number | null;
  onLoadPlan: (planId: number) => void;
  onClone: (planId: number) => void;
  isSaving: boolean;
  isDeleting: boolean;
  onNewPlan: () => void;
  onCreateNewPlan: () => void;
  onDeletePlan: () => void;
  onSave: (name: string) => void;
  setupOpen: boolean;
  setupHours: number;
  onAdjustHours: (delta: number) => void;
  onCloseSetup: () => void;
  saveOpen: boolean;
  setSaveOpen: (v: boolean) => void;
  deleteOpen: boolean;
  setDeleteOpen: (v: boolean) => void;
  onBack: () => void;
  graph?: SubjectGraph | null;
  classification?: Map<number, SubjectClassification> | null;
  currentPeriod?: { year: number; term: number } | null;
  sabbaticalOpen: boolean;
  onOpenSabbatical: () => void;
  onCloseSabbatical: () => void;
  sabbaticals: SabbaticalPeriod[];
  isSabbaticalSaving: boolean;
  onAddSabbatical: (year: number, terms: number[]) => void;
  onCancelSabbatical: (year: number, term: number) => void;
  electivesOpen: boolean;
  onOpenElectives: () => void;
  onCloseElectives: () => void;
  electiveBlocks: ElectiveBlock[];
  electiveChoices: ElectiveChoice[];
  isElectiveSaving: boolean;
  planSubjectInfoById: Map<number, { name: string; weekly_hours: number; credits: number }>;
  onSaveElectives: (selections: { electiveBlockId: number; planSubjectId: number }[]) => void;
  unahurOpen: boolean;
  onOpenUnahur: () => void;
  onCloseUnahur: () => void;
  unahurBlocks: UnahurBlock[];
  unahurChoices: UnahurChoice[];
  isUnahurSaving: boolean;
  unahurPoolPlanSubjects: { id: number; name: string; weekly_hours: number }[];
  onSaveUnahur: (selections: { unahurBlockId: number; planSubjectId: number }[]) => void;
  // Solo para el SetupModal interno (botón "+" flotante) — el alumno puede crear un
  // plan para cualquiera de sus carreras sin salir del detalle en el que está.
  enrollmentOptions?: any[];
  selectedEnrollmentId?: string;
  onSelectEnrollment?: (id: string) => void;
  isLoadingCareerData?: boolean;
}

export function PlannerDetailView({
  data,
  activeYear,
  onYearVisible,
  moveSubject,
  moveFinalEvent,
  studentId,
  hoursLimit,
  readOnly,
  isEditing,
  setIsEditing,
  onCancelEdit,
  activePlanName,
  plans,
  activePlanId,
  onLoadPlan,
  onClone,
  isSaving,
  isDeleting,
  onNewPlan,
  onCreateNewPlan,
  onDeletePlan,
  onSave,
  setupOpen,
  setupHours,
  onAdjustHours,
  onCloseSetup,
  saveOpen,
  setSaveOpen,
  deleteOpen,
  setDeleteOpen,
  onBack,
  graph,
  classification,
  currentPeriod,
  sabbaticalOpen,
  onOpenSabbatical,
  onCloseSabbatical,
  sabbaticals,
  isSabbaticalSaving,
  onAddSabbatical,
  onCancelSabbatical,
  electivesOpen,
  onOpenElectives,
  onCloseElectives,
  electiveBlocks,
  electiveChoices,
  isElectiveSaving,
  planSubjectInfoById,
  onSaveElectives,
  unahurOpen,
  onOpenUnahur,
  onCloseUnahur,
  unahurBlocks,
  unahurChoices,
  isUnahurSaving,
  unahurPoolPlanSubjects,
  onSaveUnahur,
  enrollmentOptions = [],
  selectedEnrollmentId = "",
  onSelectEnrollment,
  isLoadingCareerData = false,
}: Props) {
  const yearList = data.years.map((y) => y.year);
  const navRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Centra el tab activo horizontalmente (mobile/tablet). Esto es seguro de correr
  // ante CUALQUIER cambio de activeYear (incluido el que dispara el scroll pasivo),
  // porque no toca el scroll vertical del contenido.
  useEffect(() => {
    if (navRef.current) {
      const activeBtn = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeBtn) {
        const container = navRef.current;
        const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [activeYear]);

  // Navegación EXPLÍCITA a un año (tabs, dropdown, sidebar): actualiza el estado
  // y fuerza el scroll vertical. A diferencia de onYearVisible (que también lo
  // dispara el IntersectionObserver de scroll pasivo en TimelineContent), esta
  // función solo se llama desde clicks del usuario, así el scroll manual nunca
  // se pelea contra un salto automático.
  const scrollToYear = useCallback(
    (year: number) => {
      onYearVisible(year);
      const yearSection = document.getElementById(`year-${year}`);
      if (yearSection) {
        yearSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [onYearVisible]
  );

  return (
    <div className="flex flex-col h-full">
      {/* NAVEGACIÓN DE AÑOS - MOBILE Y TABLET */}
      <div className="block lg:hidden z-30 bg-surface border-b border-outline-variant shadow-sm flex-shrink-0">
        
        {/* DROPDOWN - SOLO MOBILE (<640px) */}
        <div className="sm:hidden px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
          <select
            value={activeYear}
            onChange={(e) => scrollToYear(Number(e.target.value))}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-outline-variant/50 bg-surface-container-lowest text-on-surface font-label-caps text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            {data.years.map((year) => (
              <option key={year.year} value={year.year}>
                AÑO {year.year}
              </option>
            ))}
          </select>
        </div>

        {/* TABS CON ICONOS - SOLO TABLET (640px - 1024px) */}
        <div ref={navRef} className="hidden sm:flex items-center gap-3 px-6 py-3 overflow-x-auto no-scrollbar scroll-smooth">
          {data.years.map((year) => (
            <button
              key={year.year}
              data-active={activeYear === year.year}
              onClick={() => scrollToYear(year.year)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap font-label-caps text-xs font-bold transition-all active:scale-95 flex-shrink-0 flex items-center gap-2 ${
                activeYear === year.year
                  ? "bg-primary text-on-primary shadow-md border-2 border-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border-2 border-outline-variant/40 shadow-sm hover:border-primary/50 hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {activeYear === year.year ? "check_circle" : "calendar_month"}
              </span>
              AÑO {year.year}
            </button>
          ))}
        </div>
      </div>

      {/* SIDEBAR VERTICAL - SOLO EN DESKTOP (>=1024px) */}
      <div className="hidden lg:block">
        <div className="fixed top-16 left-64 w-20 h-[calc(100vh-4rem)] border-r border-outline-variant/30 bg-surface flex flex-col py-6 items-center gap-6 z-30">
          <YearNavSidebar
            years={yearList}
            activeYear={activeYear}
            onSelectYear={scrollToYear}
          />
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto pb-24 sm:pb-20 lg:pb-20">
        <div className="ml-0 md:ml-20">
          <div className="px-margin">
            <PageHeader
              eyebrow={isEditing ? "Editando planificación de carrera" : "Planificador de carrera"}
              title={activePlanName}
              titleClassName="truncate max-w-[150px] sm:max-w-xs md:max-w-sm lg:max-w-[500px]"
              actions={
                <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
                  <PlannerActions
                    isEditing={isEditing}
                    plans={plans}
                    activePlanId={activePlanId}
                    onLoadPlan={onLoadPlan}
                    onClone={onClone}
                    onSave={() => setSaveOpen(true)}
                    onDelete={() => setDeleteOpen(true)}
                    onEdit={() => setIsEditing(true)}
                    onCancelEdit={onCancelEdit}
                    onBack={onBack}
                    onOpenSabbatical={onOpenSabbatical}
                    onOpenElectives={onOpenElectives}
                    onOpenUnahur={onOpenUnahur}
                  />
                </div>
              }
            />
          </div>
          <div className="pt-gutter overflow-x-hidden lg:overflow-x-visible">
            <TimelineContent
              plan={data}
              activeYear={activeYear}
              onMoveSubject={moveSubject}
              onMoveFinal={moveFinalEvent}
              onYearVisible={onYearVisible}
              studentId={studentId}
              hoursLimit={hoursLimit}
              readOnly={readOnly}
              graph={graph}
              classification={classification}
              sabbaticals={sabbaticals}
              onCancelSabbatical={onCancelSabbatical}
            />
          </div>
        </div>
      </div>

      {/* CONTENEDOR FLOTANTE: Scroll Top + Add Button */}
      <div className="fixed bottom-[calc(theme(spacing.margin)+5rem)] right-margin md:bottom-[calc(theme(spacing.margin)+4rem)] lg:bottom-margin z-50 flex flex-col gap-3 items-end pointer-events-none">
        
        {/* BOTÓN FLOTANTE ADD */}
        {!isEditing && (
          <div className="pointer-events-auto">
            <FloatingAddButton onClick={onNewPlan} />
          </div>
        )}
      </div>

      {setupOpen && (
        <SetupModal
          hours={setupHours}
          onAdjustHours={onAdjustHours}
          onCancel={onCloseSetup}
          onContinue={onCreateNewPlan}
          enrollmentOptions={enrollmentOptions}
          selectedEnrollmentId={selectedEnrollmentId}
          onSelectEnrollment={onSelectEnrollment}
          isLoadingCareerData={isLoadingCareerData}
        />
      )}

      {saveOpen && (
        <SavePlanModal
          isOpen={saveOpen}
          isSaving={isSaving}
          initialName={activePlanName}
          onSave={onSave}
          onCancel={() => setSaveOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeletePlanModal
          isOpen={deleteOpen}
          isDeleting={isDeleting}
          planName={activePlanName}
          onConfirm={onDeletePlan}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      {sabbaticalOpen && (
        <SabbaticalModal
          years={yearList}
          currentPeriod={currentPeriod}
          sabbaticals={sabbaticals}
          isSaving={isSabbaticalSaving}
          onConfirm={onAddSabbatical}
          onCancelSabbatical={onCancelSabbatical}
          onClose={onCloseSabbatical}
        />
      )}

      {electivesOpen && (
        <ElectiveModal
          blocks={electiveBlocks}
          initialChoices={electiveChoices}
          planSubjectInfoById={planSubjectInfoById}
          classification={classification}
          isSaving={isElectiveSaving}
          onSave={onSaveElectives}
          onClose={onCloseElectives}
        />
      )}

      {unahurOpen && (
        <UnahurModal
          blocks={unahurBlocks}
          initialChoices={unahurChoices}
          unahurPoolPlanSubjects={unahurPoolPlanSubjects}
          classification={classification}
          isSaving={isUnahurSaving}
          onSave={onSaveUnahur}
          onClose={onCloseUnahur}
        />
      )}
    </div>
  );
}
