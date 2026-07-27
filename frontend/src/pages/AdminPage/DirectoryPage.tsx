import { useRef, useEffect, useCallback, useState } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { ConfirmDialog } from "@/widgets/ui/ConfirmDialog";
import { MobileListDrawer } from "@/widgets/ui/MobileListDrawer";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { useDirectoryData, DirectoryFilterBar, UserListPanel, UserFormPanel, DirectoryMobileFilter } from "@/features/directory";
import { ProductTour, type TourStep } from "@/features/onboarding";

const directoryTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Directorio de Usuarios",
    content: "Acá administrás todos los usuarios de la plataforma: estudiantes y administradores.",
  },
  {
    target: '[data-tour="directory-new"]',
    title: "Nuevo usuario",
    content: "Creá un usuario nuevo, estudiante o administrador.",
  },
  {
    target: '[data-tour="directory-filters"]',
    title: "Filtrar usuarios",
    content: "Buscá por nombre o email, o filtrá por rol, instituto, carrera y estado.",
  },
  {
    target: '[data-tour="directory-list"]',
    title: "Listado de usuarios",
    content: "Seleccioná un usuario para ver y editar sus datos.",
  },
  {
    target: '[data-tour="directory-form"]',
    title: "Datos del usuario",
    content: "Acá editás la información personal, académica y de acceso del usuario seleccionado.",
  },
];

export function DirectoryPage() {
  const {
    filteredUsers,
    selectedUser,
    selectedUserId,
    careersOptions,
    careersByInstitute,
    instituteFilterOptions,
    usersError,
    searchTerm,
    setSearchTerm,
    filterIsAdmin,
    setFilterIsAdmin,
    filterInstituteId,
    setFilterInstituteId,
    filterCareerId,
    setFilterCareerId,
    statusFilter,
    setStatusFilter,
    filterUnassigned,
    setFilterUnassigned,
    isOpen,
    options,
    close,
    handleConfirm,
    handleSelectUser,
    handleNewUser,
    handleDeleteUser,
    refreshUsers,
    resetFilters,
  } = useDirectoryData();

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
  }, [constrainGridHeight, filteredUsers]);

  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleMobileSelect = (id: string) => {
    handleSelectUser(id);
    setMobileListOpen(false);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 space-y-gutter">
        <PageHeader
          eyebrow="Administración"
          title="Directorio de Usuarios"
          actions={
            <Button data-tour="directory-new" variant="primary" onClick={handleNewUser}>
              <span className="material-symbols-outlined text-[24px]">add</span>
              Nuevo usuario
            </Button>
          }
        />

        <div data-tour="directory-filters" className="hidden xl:block">
          <DirectoryFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterIsAdmin={filterIsAdmin}
            onAdminChange={setFilterIsAdmin}
            filterUnassigned={filterUnassigned}
            onUnassignedChange={setFilterUnassigned}
            filterInstituteId={filterInstituteId}
            onInstituteChange={setFilterInstituteId}
            instituteFilterOptions={instituteFilterOptions}
            filterCareerId={filterCareerId}
            onCareerChange={setFilterCareerId}
            careersByInstitute={careersByInstitute}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onReset={resetFilters}
          />
        </div>

        <div ref={gridRef} className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-gutter grid-rows-1">
          <div data-tour="directory-list" className="hidden xl:block xl:col-span-5">
            <UserListPanel
              filteredUsers={filteredUsers}
              selectedUserId={selectedUserId}
              onSelect={handleSelectUser}
              usersError={usersError}
            />
          </div>

          <UserFormPanel
            dataTour="directory-form"
            selectedUser={selectedUser}
            careersOptions={careersOptions}
            onDelete={handleDeleteUser}
            onCreated={refreshUsers}
            onSaved={refreshUsers}
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

      <ProductTour tourId="admin-directory" steps={directoryTourSteps} />

      <MobileListDrawer
        isOpen={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        title="Usuarios"
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
        <UserListPanel
          filteredUsers={filteredUsers}
          selectedUserId={selectedUserId}
          onSelect={handleMobileSelect}
          usersError={usersError}
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
        <DirectoryMobileFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterIsAdmin={filterIsAdmin}
          onAdminChange={setFilterIsAdmin}
          filterUnassigned={filterUnassigned}
          onUnassignedChange={setFilterUnassigned}
          filterInstituteId={filterInstituteId}
          onInstituteChange={setFilterInstituteId}
          instituteFilterOptions={instituteFilterOptions}
          filterCareerId={filterCareerId}
          onCareerChange={setFilterCareerId}
          careersByInstitute={careersByInstitute}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      </MobileFilterSheet>
    </>
  );
}
