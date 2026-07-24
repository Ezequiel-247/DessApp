import { useRef, useEffect, useCallback, useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { MobileListDrawer } from "@/widgets/ui/MobileListDrawer";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { useCareersData, useCareersFilter, useCareerForm, CareersFilterBar, CareerListPanel, CareerFormPanel, CareersMobileFilter } from "@/features/careers";

export function CareersPage() {
  const { careers, setCareers, institutes, selectedCareerId, setSelectedCareerId } = useCareersData();
  const { searchTerm, setSearchTerm, filterInstituteId, setFilterInstituteId, filteredCareers, formatInstituteName, resetFilters } = useCareersFilter(careers, institutes);
  const { draft, validationErrors, selectedCareer, handleSelect, handleNew, handleFieldChange, handleSave, handleDelete, isOpen, options, close, handleConfirm } = useCareerForm({
    careers,
    setCareers,
    institutes,
    selectedCareerId,
    setSelectedCareerId,
  });

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
  }, [constrainGridHeight, filteredCareers]);

  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleMobileSelect = (id: string) => {
    handleSelect(id);
    setMobileListOpen(false);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader
          eyebrow="Configuración académica"
          title="Gestión de Carreras"
          actions={
            <Button variant="primary" onClick={handleNew}>
              <span className="material-symbols-outlined text-[24px]">add</span>
              Nueva carrera
            </Button>
          }
        />

        <div className="hidden xl:block">
          <CareersFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterInstituteId={filterInstituteId}
            onInstituteChange={(value) => {
              setFilterInstituteId(value);
              setSelectedCareerId(null);
            }}
            onReset={resetFilters}
            institutes={institutes}
          />
        </div>

        <div ref={gridRef} className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-gutter grid-rows-1">
          <div className="hidden xl:block xl:col-span-5">
            <CareerListPanel
              filteredCareers={filteredCareers}
              selectedCareerId={selectedCareerId}
              onSelect={handleSelect}
              formatInstituteName={formatInstituteName}
            />
          </div>

          <CareerFormPanel
            selectedCareer={selectedCareer}
            draft={draft}
            validationErrors={validationErrors}
            onFieldChange={handleFieldChange}
            onSave={handleSave}
            onDelete={handleDelete}
            onNew={handleNew}
            institutes={institutes}
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
        title="Carreras"
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
        <CareerListPanel
          filteredCareers={filteredCareers}
          selectedCareerId={selectedCareerId}
          onSelect={handleMobileSelect}
          formatInstituteName={formatInstituteName}
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
        <CareersMobileFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterInstituteId={filterInstituteId}
          onInstituteChange={setFilterInstituteId}
          institutes={institutes}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      </MobileFilterSheet>
    </>
  );
}
