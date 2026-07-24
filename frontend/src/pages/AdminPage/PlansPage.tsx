import { useRef, useEffect, useCallback, useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { Modal } from "@/widgets/ui/Modal";
import { MobileListDrawer } from "@/widgets/ui/MobileListDrawer";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { PlanCreationWizard } from "@/features/study-plan";
import { usePlansData, PlansFilterBar, PlanListPanel, PlanInfoPanel, PlanBreakdown, PlansMobileFilter } from "@/features/plans";

export function PlansPage() {
  const {
    institutes,
    filteredCareers,
    filteredPlans,
    isLoading,
    error,
    selectedInstitute,
    selectedCareer,
    selectedPlan,
    selectedPlanId,
    deleteOpen,
    showWizard,
    searchTerm,
    setSearchTerm,
    setDeleteOpen,
    setShowWizard,
    formatCareerName,
    formatInstituteNameFromCareer,
    statusLabel,
    statusVariant,
    resetFilters,
    handleSelectInstitute,
    handleSelectCareer,
    handleSelectPlan,
    handleNewPlan,
    confirmDelete,
  } = usePlansData();

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const constrainGridHeight = useCallback(() => {
    if (window.innerWidth < 1280) return;
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 16;
      if (available > 300) {
        gridRef.current.style.minHeight = `${available}px`;
        gridRef.current.style.maxHeight = `${available}px`;
      }
    }
  }, []);

  useEffect(() => {
    constrainGridHeight();
    window.addEventListener("resize", constrainGridHeight);
    return () => window.removeEventListener("resize", constrainGridHeight);
  }, [constrainGridHeight, filteredPlans]);

  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleMobileSelect = (id: string) => {
    handleSelectPlan(id);
    setMobileListOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader eyebrow="Configuración académica" title="Gestión de Planes de Estudio" />
        <div className="flex items-center justify-center flex-1">
          <span className="text-on-surface-variant">Cargando planes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader eyebrow="Configuración académica" title="Gestión de Planes de Estudio" />
        <div className="flex items-center justify-center flex-1">
          <span className="text-error">{error}</span>
        </div>
      </div>
    );
  }

  if (showWizard || editingPlanId) {
    return <PlanCreationWizard planId={editingPlanId ?? undefined} onClose={() => { setShowWizard(false); setEditingPlanId(null); }} />;
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader
          eyebrow="Configuración académica"
          title="Gestión de Planes de Estudio"
          actions={
            <Button variant="primary" onClick={handleNewPlan}>
              <span className="material-symbols-outlined text-[24px]">add</span>
              Crear nueva
            </Button>
          }
        />

        <div className="hidden xl:block">
          <PlansFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedInstitute={selectedInstitute}
            onInstituteChange={handleSelectInstitute}
            institutes={institutes}
            selectedCareer={selectedCareer}
            onCareerChange={handleSelectCareer}
            filteredCareers={filteredCareers}
            onReset={resetFilters}
          />
        </div>

        <div ref={gridRef} className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-gutter grid-rows-1">
          <div className="hidden xl:block xl:col-span-5">
            <PlanListPanel
              filteredPlans={filteredPlans}
              selectedPlanId={selectedPlanId}
              onSelectPlan={handleSelectPlan}
              formatCareerName={formatCareerName}
              formatInstituteNameFromCareer={formatInstituteNameFromCareer}
              statusVariant={statusVariant}
              statusLabel={statusLabel}
            />
          </div>

          <div className="xl:col-span-7 flex flex-col gap-gutter xl:h-full xl:overflow-y-auto">
            <PlanInfoPanel
              selectedPlan={selectedPlan}
              formatCareerName={formatCareerName}
              formatInstituteNameFromCareer={formatInstituteNameFromCareer}
              statusVariant={statusVariant}
              statusLabel={statusLabel}
              onNewPlan={handleNewPlan}
              onEdit={selectedPlan ? () => setEditingPlanId(selectedPlan.id) : undefined}
              onDeleteOpen={() => setDeleteOpen(true)}
            />

            {selectedPlan && (
              <PlanBreakdown planId={selectedPlan.id} />
            )}
          </div>
        </div>

        <div className="xl:hidden h-16" />

        {deleteOpen && selectedPlan && (
          <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar plan" size="sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-error">delete</span>
              </div>
              <div>
                <p className="text-sm text-on-surface font-medium mb-1">¿Estás seguro de eliminar este plan?</p>
                <p className="text-sm text-on-surface-variant">
                  Se eliminará <strong>"{selectedPlan.name}"</strong> y no podrás recuperarlo.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1 !bg-error !border-error hover:!bg-error/90" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </Modal>
        )}
      </div>

      <MobileListDrawer
        isOpen={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        title="Planes"
        headerButtons={
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="p-1 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">filter_list</span>
          </button>
        }
      >
        <PlanListPanel
          filteredPlans={filteredPlans}
          selectedPlanId={selectedPlanId}
          onSelectPlan={handleMobileSelect}
          formatCareerName={formatCareerName}
          formatInstituteNameFromCareer={formatInstituteNameFromCareer}
          statusVariant={statusVariant}
          statusLabel={statusLabel}
          hideHeader
        />
      </MobileListDrawer>

      {!mobileListOpen && (
        <Button
          variant="primary"
          onClick={() => setMobileListOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-[60] w-14 h-14 !rounded-full flex items-center justify-center xl:hidden"
        >
          <span className="material-symbols-outlined text-[24px]">list</span>
        </Button>
      )}

      <MobileFilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtros"
      >
        <PlansMobileFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedInstitute={selectedInstitute}
          onInstituteChange={handleSelectInstitute}
          institutes={institutes}
          selectedCareer={selectedCareer}
          onCareerChange={handleSelectCareer}
          filteredCareers={filteredCareers}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      </MobileFilterSheet>
    </>
  );
}
