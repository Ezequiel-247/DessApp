import { useEffect } from "react";
import { Button } from "@/widgets/ui/Button";
import { useDocumentTitle, PlannerDashboard, SimulatorView, SetupModal } from "@/features/myPlanner";
import { PlannerDetailView } from "@/features/myPlanner/components/PlannerDetailView";
import { useMyPlannerPage } from "@/features/myPlanner/hooks/useMyPlannerPage";

export function MyPlannerPage() {
  useDocumentTitle("Mi Planificador");
  const p = useMyPlannerPage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [p.view]);

  if (p.view === "menu") {
    return (
      <>
        <PlannerDashboard
          plans={p.plans}
          activePlanId={p.activePlanId}
          previewData={p.previewData}
          onSelectPlan={p.handleSelectPlan}
           onEnterPlan={() => { if (p.activePlanId) p.handleLoadPlan(p.activePlanId); }}
          onNewProjection={p.handleNewPlan}
          onOpenSimulator={() => p.setView("simulator")}
          onClone={p.duplicate}
          enrollmentOptions={p.enrollmentOptions}
          plansByEnrollment={p.plansByEnrollment}
          onNewPlanForEnrollment={p.handleNewPlanForEnrollment}
          onRenamePlan={p.handleRenamePlanById}
          onDeletePlan={p.handleDeletePlanById}
        />
        {p.setupOpen && (
          <SetupModal
            hours={p.hours}
            onAdjustHours={p.adjustHours}
            onCancel={p.cancelSetup}
            onContinue={p.handleCreateNewPlan}
            enrollmentOptions={p.enrollmentOptions}
            selectedEnrollmentId={p.selectedEnrollmentId}
            onSelectEnrollment={p.handleEnrollmentChange}
            isLoadingCareerData={p.isLoadingCareerData}
          />
        )}
      </>
    );
  }

  if (p.view === "simulator") {
    return (
      <SimulatorView 
        onBack={() => p.setView("menu")} 
        graph={p.graph}
        classification={p.classification}
      />
    );
  }

  if (p.isLoading) {
    return <LoadingView />;
  }

  if (p.error) {
    return <ErrorView error={p.error} onBack={() => p.setView("menu")} />;
  }

  if (!p.data) return null;

  return (
    <PlannerDetailView
      data={p.data}
      activeYear={p.activeYear}
      onYearVisible={p.setActiveYear}
      moveSubject={p.moveSubject}
      moveFinalEvent={p.moveFinalEvent}
      studentId={p.user?.id}
      hoursLimit={p.effectiveHours}
      readOnly={!p.isEditing}
      isEditing={p.isEditing}
      setIsEditing={p.setIsEditing}
      onCancelEdit={p.handleCancelEdit}
      activePlanName={p.activePlanName}
      plans={p.plans}
      activePlanId={p.activePlanId}
      onLoadPlan={p.handleLoadPlan}
      onClone={p.duplicate}
      isSaving={p.isSaving}
      isDeleting={p.isDeleting}
      onNewPlan={p.handleNewPlan}
      onCreateNewPlan={p.handleCreateNewPlan}
      onDeletePlan={p.handleDeletePlan}
      onSave={p.handleSave}
      setupOpen={p.setupOpen}
      setupHours={p.hours}
      onAdjustHours={p.adjustHours}
      onCloseSetup={p.cancelSetup}
      saveOpen={p.saveOpen}
      setSaveOpen={p.setSaveOpen}
      deleteOpen={p.deleteOpen}
      setDeleteOpen={p.setDeleteOpen}
      onBack={() => p.setView("menu")}
      graph={p.graph}
      classification={p.classification}
      currentPeriod={p.currentPeriod}
      sabbaticalOpen={p.sabbaticalOpen}
      onOpenSabbatical={p.openSabbatical}
      onCloseSabbatical={p.closeSabbatical}
      sabbaticals={p.sabbaticals}
      isSabbaticalSaving={p.isSabbaticalSaving}
      onAddSabbatical={p.addSabbatical}
      onCancelSabbatical={p.cancelSabbatical}
      electivesOpen={p.electivesOpen}
      onOpenElectives={p.openElectives}
      onCloseElectives={p.closeElectives}
      electiveBlocks={p.electiveBlocks}
      electiveChoices={p.electiveChoices}
      isElectiveSaving={p.isElectiveSaving}
      planSubjectInfoById={p.planSubjectInfoById}
      onSaveElectives={p.saveElectiveChoices}
      unahurOpen={p.unahurOpen}
      onOpenUnahur={p.openUnahur}
      onCloseUnahur={p.closeUnahur}
      unahurBlocks={p.unahurBlocks}
      unahurChoices={p.unahurChoices}
      isUnahurSaving={p.isUnahurSaving}
      unahurPoolPlanSubjects={p.unahurPoolPlanSubjects}
      onSaveUnahur={p.saveUnahurChoices}
      enrollmentOptions={p.enrollmentOptions}
      selectedEnrollmentId={p.selectedEnrollmentId}
      onSelectEnrollment={p.handleEnrollmentChange}
      isLoadingCareerData={p.isLoadingCareerData}
    />
  );
}

function LoadingView() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="animate-pulse text-center space-y-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin block">progress_activity</span>
        <p className="text-on-surface-variant">Generando tu planificación...</p>
      </div>
    </div>
  );
}

function ErrorView({ error, onBack }: { error: string; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full items-center justify-center pt-margin">
      <div className="bg-error-container/10 border border-error/30 rounded-2xl p-8 text-center max-w-lg">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error_outline</span>
        <p className="text-error font-semibold mb-2">Error al generar el plan</p>
        <p className="text-on-surface-variant text-sm mb-6">{error}</p>
        <Button variant="primary" onClick={onBack}>
          Volver al Menú
        </Button>
      </div>
    </div>
  );
}
