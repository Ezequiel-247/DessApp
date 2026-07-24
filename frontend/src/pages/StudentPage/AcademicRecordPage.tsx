import { useState } from "react";
import { useAcademicRecord, ImportExcelModal, AcademicRecordFormModal, AcademicRecordFilters, AcademicRecordTable } from "@/features/academic-record";
import { SoftWarningModal } from "@/features/academic-record/components/SoftWarningModal";
import { useAuth } from "@/app/AuthContext";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Card } from "@/widgets/ui/Card";
import { Button } from "@/widgets/ui/Button";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";

export function AcademicRecordPage() {
  const { user } = useAuth();
  const hook = useAcademicRecord();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [subjectSourceFilter, setSubjectSourceFilter] = useState<"plan" | "unahur">("plan");

  const hasPlanSubjects = hook.subjectsForPlanSelector.length > 0;
  const hasUnahurSubjects = hook.subjectsForUnahurSelector.length > 0;
  const hasAnySubject = hasPlanSubjects || hasUnahurSubjects;

  const effectiveFilter = subjectSourceFilter === "plan" && !hasPlanSubjects && hasUnahurSubjects ? "unahur"
    : subjectSourceFilter === "unahur" && !hasUnahurSubjects && hasPlanSubjects ? "plan"
    : subjectSourceFilter;

  const refreshAll = () => {
    hook.loadRecords();
    hook.loadFinalExams();
    hook.loadActivityRecords();
    hook.loadActivities();
    hook.loadSubjects();
    if (hook.selectedEnrollmentId) hook.loadPlanSubjects(hook.selectedEnrollmentId);
  };

  const handleCloseModal = () => setModalMode(null);
  const handleOpenAdd = () => { hook.handleCancelEdit(); setSubjectSourceFilter("plan"); setModalMode("add"); };
  const handleOpenEdit = () => setModalMode("edit");
  const handleSourceFilterChange = (f: "plan" | "unahur") => setSubjectSourceFilter(f);
  const handleSave = (onSuccess?: () => void) => hook.handleSaveRecord(onSuccess);

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        eyebrow="Historia académica"
        title="Carga y gestion de calificaciones"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
              <span className="material-symbols-outlined">upload_file</span>
              Importar Excel
            </Button>
            <div className="w-px h-5 bg-outline-variant/50" />
            <Button variant="primary" onClick={handleOpenAdd}>
              <span className="material-symbols-outlined">add</span>
              Agregar registro
            </Button>
          </div>
        }
      />

      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={() => { setIsImportOpen(false); refreshAll(); }}
        userId={user?.id ?? ""}
        existingRecords={hook.records}
        subjects={hook.availableSubjects}
      />

      <AcademicRecordFormModal
        isOpen={modalMode !== null}
        mode={modalMode}
        onClose={handleCloseModal}
        draft={hook.draft}
        validationErrors={hook.validationErrors}
        subjects={hook.subjects}
        subjectsForRegularidadSelector={hook.subjectsForRegularidadSelector}
        subjectsForUnahurSelector={hook.subjectsForUnahurSelector}
        subjectsWithRegularidad={hook.subjectsWithRegularidad}
        hasExamEligibleSubjects={hook.hasExamEligibleSubjects}
        examEligibleData={hook.examEligibleData}
        hasAnySubject={hasAnySubject}
        hasPlanSubjects={hasPlanSubjects}
        hasUnahurSubjects={hasUnahurSubjects}
        effectiveFilter={effectiveFilter}
        subjectSourceFilter={subjectSourceFilter}
        onSourceFilterChange={handleSourceFilterChange}
        activities={hook.activities}
        availableActivities={hook.availableActivities}
        selectedRecord={hook.selectedRecord}
        selectedExam={hook.selectedExam}
        selectedActivityRecord={hook.selectedActivityRecord}
        approvedExamRecordIds={hook.approvedExamRecordIds}
        onFieldChange={hook.handleFieldChange}
        onSave={handleSave}
        onCancelEdit={hook.handleCancelEdit}
        onDelete={hook.handleDeleteRecord}
        onAfterAction={handleCloseModal}
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 min-w-0 space-y-md">
          <AcademicRecordFilters
            searchTerm={hook.searchTerm}
            onSearchChange={hook.setSearchTerm}
            typeFilter={hook.typeFilter}
            onTypeFilterChange={hook.setTypeFilter}
            statusFilter={hook.statusFilter}
            onStatusFilterChange={hook.setStatusFilter}
            yearFilter={hook.yearFilter}
            onYearFilterChange={hook.setYearFilter}
            semesterFilter={hook.semesterFilter}
            onSemesterFilterChange={hook.setSemesterFilter}
            uniqueYears={hook.uniqueYears}
            enrollmentOptions={hook.enrollmentOptions}
            selectedEnrollmentId={hook.selectedEnrollmentId}
            onEnrollmentChange={hook.setSelectedEnrollmentId}
          />

          <Card bodyClassName="overflow-x-auto px-0 py-0">
            <AcademicRecordTable
              displayRows={hook.displayRows}
              records={hook.records}
              finalExams={hook.finalExams}
              activityRecords={hook.activityRecords}
              approvedExamRecordIds={hook.approvedExamRecordIds}
              onSelectRecord={hook.handleSelectRecord}
              onSelectExam={hook.handleSelectExam}
              onSelectActivityRecord={hook.handleSelectActivityRecord}
              onOpenEdit={handleOpenEdit}
            />
          </Card>
        </div>
      </div>

      {hook.isConfirmOpen && hook.confirmOptions && (
        <ConfirmDialog
          isOpen={hook.isConfirmOpen}
          title={hook.confirmOptions.title || "Confirmar"}
          description={hook.confirmOptions.description}
          confirmLabel={hook.confirmOptions.confirmLabel || "Aceptar"}
          cancelLabel={hook.confirmOptions.cancelLabel || "Cancelar"}
          variant={hook.confirmOptions.variant || "primary"}
          isLoading={hook.isConfirmLoading}
          onConfirm={hook.handleConfirm}
          onCancel={hook.closeConfirm}
        />
      )}

      {hook.softWarning && (
        <SoftWarningModal
          isOpen={hook.isWarningOpen}
          title={hook.softWarning.title}
          message={hook.softWarning.message}
          storageKey={hook.softWarning.storageKey}
          onConfirm={hook.confirmWarning}
          onCancel={hook.cancelWarning}
        />
      )}
    </div>
  );
}
