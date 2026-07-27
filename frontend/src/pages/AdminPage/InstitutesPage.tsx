import { useRef, useEffect, useCallback, useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { MobileListDrawer } from "@/widgets/ui/MobileListDrawer";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { useInstitutesData, InstitutesFilterBar, InstituteListPanel, InstituteFormPanel, InstitutesMobileFilter } from "@/features/institutes";
import { ProductTour, type TourStep } from "@/features/onboarding";

const institutesTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Gestión de Institutos",
    content: "Acá administrás los institutos que dictan las carreras.",
  },
  {
    target: '[data-tour="institutes-new"]',
    title: "Nuevo instituto",
    content: "Creá un instituto nuevo.",
  },
  {
    target: '[data-tour="institutes-filters"]',
    title: "Filtrar institutos",
    content: "Buscá por nombre o filtrá por estado.",
  },
  {
    target: '[data-tour="institutes-list"]',
    title: "Listado de institutos",
    content: "Seleccioná un instituto para ver y editar sus datos.",
  },
  {
    target: '[data-tour="institutes-form"]',
    title: "Datos del instituto",
    content: "Acá editás el nombre y demás datos del instituto seleccionado.",
  },
];

export function InstitutesPage() {
  const {
    filteredRecords,
    selectedRecord,
    selectedRecordId,
    isLoading,
    draft,
    errors,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    STATUS_OPTIONS,
    handleSelect,
    handleNew,
    handleFieldChange,
    handleSave,
    handleDelete,
    isOpen,
    options,
    close,
    handleConfirm,
    resetFilters,
  } = useInstitutesData();

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
  }, [constrainGridHeight, filteredRecords]);

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
          title="Gestión de Institutos"
          actions={
            <Button data-tour="institutes-new" variant="primary" onClick={handleNew}>
              <span className="material-symbols-outlined text-[24px]">add</span>
              Nuevo instituto
            </Button>
          }
        />

        <div data-tour="institutes-filters" className="hidden xl:block">
          <InstitutesFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            onReset={resetFilters}
          />
        </div>

        <div ref={gridRef} className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-gutter grid-rows-1">
          <div data-tour="institutes-list" className="hidden xl:block xl:col-span-5">
            <InstituteListPanel
              filteredRecords={filteredRecords}
              selectedRecordId={selectedRecordId}
              onSelect={handleSelect}
              isLoading={isLoading}
            />
          </div>

          <InstituteFormPanel
            dataTour="institutes-form"
            selectedRecord={selectedRecord}
            draft={draft}
            errors={errors}
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

      <ProductTour tourId="admin-institutes" steps={institutesTourSteps} />

      <MobileListDrawer
        isOpen={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        title="Institutos"
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
        <InstituteListPanel
          filteredRecords={filteredRecords}
          selectedRecordId={selectedRecordId}
          onSelect={handleMobileSelect}
          isLoading={isLoading}
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
        <InstitutesMobileFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={STATUS_OPTIONS}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      </MobileFilterSheet>
    </>
  );
}
