import { useRef, useEffect, useCallback, useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { MobileListDrawer } from "@/widgets/ui/MobileListDrawer";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { useActivitiesData, ActivitiesFilterBar, ActivityListPanel, ActivityFormPanel, ActivitiesMobileFilter } from "@/features/activities";

export function ActivitiesPage() {
  const {
    filteredActivities,
    isLoading,
    error,
    selectedId,
    selectedActivity,
    draft,
    saving,
    validationErrors,
    searchTerm,
    setSearchTerm,
    filterUnassigned,
    setFilterUnassigned,
    filterInstituteId,
    setFilterInstituteId,
    filterCareerId,
    setFilterCareerId,
    handleFilterInstituteChange,
    handleFilterCareerChange,
    instituteFilterOptions,
    careersByInstitute,
    clearSelection,
    resetFilters,
    handleSelect,
    handleNew,
    handleFieldChange,
    handleSave,
    handleDelete,
    isOpen,
    options,
    close,
    handleConfirm,
  } = useActivitiesData();

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
  }, [constrainGridHeight, filteredActivities]);

  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleMobileSelect = (id: string) => {
    handleSelect(id);
    setMobileListOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader eyebrow="Configuración académica" title="Gestión de Actividades" />
        <div className="flex items-center justify-center h-64">
          <span className="text-on-surface-variant">Cargando actividades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader eyebrow="Configuración académica" title="Gestión de Actividades" />
        <div className="flex items-center justify-center h-64">
          <span className="text-error">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader
          eyebrow="Configuración académica"
          title="Actividades con Créditos"
          actions={
            <Button variant="primary" onClick={handleNew}>
              <span className="material-symbols-outlined text-[24px]">add</span>
              Nueva actividad
            </Button>
          }
        />

        <div className="hidden xl:block">
          <ActivitiesFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterUnassigned={filterUnassigned}
            onUnassignedChange={setFilterUnassigned}
            filterInstituteId={filterInstituteId}
            onInstituteChange={handleFilterInstituteChange}
            instituteFilterOptions={instituteFilterOptions}
            filterCareerId={filterCareerId}
            onCareerChange={handleFilterCareerChange}
            careersByInstitute={careersByInstitute}
            onReset={resetFilters}
          />
        </div>

        <div ref={gridRef} className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-gutter grid-rows-1">
          <div className="hidden xl:block xl:col-span-5">
            <ActivityListPanel
              activities={filteredActivities}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>

          <ActivityFormPanel
            selectedActivity={selectedActivity}
            draft={draft}
            saving={saving}
            validationErrors={validationErrors}
            onFieldChange={handleFieldChange}
            onSave={handleSave}
            onDelete={handleDelete}
            onNew={handleNew}
          />
        </div>

        <div className="xl:hidden h-16" />

        {isOpen && options && (
          <ConfirmDialog
            isOpen={isOpen}
            title={options.title || "Confirmar"}
            description={options.description}
            confirmLabel={options.confirmLabel || "Aceptar"}
            cancelLabel={options.cancelLabel || "Cancelar"}
            variant={options.variant || "primary"}
            onConfirm={() => handleConfirm()}
            onCancel={close}
          />
        )}
      </div>

      <MobileListDrawer
        isOpen={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        title="Actividades"
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
        <ActivityListPanel
          activities={filteredActivities}
          selectedId={selectedId}
          onSelect={handleMobileSelect}
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
        <ActivitiesMobileFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterUnassigned={filterUnassigned}
          onUnassignedChange={setFilterUnassigned}
          filterInstituteId={filterInstituteId}
          onInstituteChange={handleFilterInstituteChange}
          instituteFilterOptions={instituteFilterOptions}
          filterCareerId={filterCareerId}
          onCareerChange={handleFilterCareerChange}
          careersByInstitute={careersByInstitute}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      </MobileFilterSheet>
    </>
  );
}
