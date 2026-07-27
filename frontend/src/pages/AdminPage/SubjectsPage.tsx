import { useRef, useEffect, useCallback, useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { MobileListDrawer } from "@/widgets/ui/MobileListDrawer";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { useSubjectsData, SubjectsFilterBar, SubjectListPanel, SubjectFormPanel, SubjectsMobileFilter } from "@/features/subjects";
import { ProductTour, type TourStep } from "@/features/onboarding";

const subjectsTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Gestión de Materias",
    content: "Acá administrás las materias de los planes de estudio.",
  },
  {
    target: '[data-tour="subjects-new"]',
    title: "Nueva materia",
    content: "Creá una materia nueva para asignarla luego a un plan.",
  },
  {
    target: '[data-tour="subjects-filters"]',
    title: "Filtrar materias",
    content: "Buscá por nombre o filtrá por instituto, carrera, UNaHUR o sin asignar.",
  },
  {
    target: '[data-tour="subjects-list"]',
    title: "Listado de materias",
    content: "Seleccioná una materia para ver y editar sus datos.",
  },
  {
    target: '[data-tour="subjects-form"]',
    title: "Datos de la materia",
    content: "Acá editás el nombre, horas semanales y demás datos de la materia seleccionada.",
  },
];

export function SubjectsPage() {
  const {
    filteredSubjects,
    isLoading,
    error,
    selectedId,
    selectedSubject,
    draft,
    saving,
    validationErrors,
    searchTerm,
    setSearchTerm,
    filterUnahur,
    setFilterUnahur,
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
  } = useSubjectsData();

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
  }, [constrainGridHeight, filteredSubjects]);

  const [mobileListOpen, setMobileListOpen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);

  const handleMobileSelect = (id: string) => {
    handleSelect(id);
    setMobileListOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader eyebrow="Configuración académica" title="Gestión de Materias" />
        <div className="flex items-center justify-center h-64">
          <span className="text-on-surface-variant">Cargando materias...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader eyebrow="Configuración académica" title="Gestión de Materias" />
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
          title="Gestión de Materias"
          actions={
            <Button data-tour="subjects-new" variant="primary" onClick={handleNew}>
              <span className="material-symbols-outlined text-[24px]">add</span>
              Nueva materia
            </Button>
          }
        />

        <div data-tour="subjects-filters" className="hidden xl:block">
          <SubjectsFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterUnahur={filterUnahur}
            onUnahurChange={setFilterUnahur}
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
          <div data-tour="subjects-list" className="hidden xl:block xl:col-span-5">
            <SubjectListPanel
              subjects={filteredSubjects}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>

          <SubjectFormPanel
            dataTour="subjects-form"
            selectedSubject={selectedSubject}
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

      <ProductTour tourId="admin-subjects" steps={subjectsTourSteps} />

      <MobileListDrawer
        isOpen={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        title="Materias"
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
        <SubjectListPanel
          subjects={filteredSubjects}
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
        <SubjectsMobileFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterUnahur={filterUnahur}
          onUnahurChange={setFilterUnahur}
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
