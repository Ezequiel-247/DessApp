import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { Dropdown } from "@/widgets/ui/Dropdown";
import { InputToggle } from "@/widgets/ui/InputToggle";
import type { Career } from "@/entities/Career";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterIsAdmin: boolean;
  onAdminChange: (checked: boolean) => void;
  filterUnassigned: boolean;
  onUnassignedChange: (checked: boolean) => void;
  filterInstituteId: string;
  onInstituteChange: (value: string) => void;
  instituteFilterOptions: { value: string; label: string }[];
  filterCareerId: string;
  onCareerChange: (value: string) => void;
  careersByInstitute: Career[];
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}

export function DirectoryFilterBar({
  searchTerm,
  onSearchChange,
  filterIsAdmin,
  onAdminChange,
  filterUnassigned,
  onUnassignedChange,
  filterInstituteId,
  onInstituteChange,
  instituteFilterOptions,
  filterCareerId,
  onCareerChange,
  careersByInstitute,
  statusFilter,
  onStatusChange,
  onReset,
}: Props) {
  const instCareerDisabled = filterIsAdmin || filterUnassigned;
  const careerDisabled = instCareerDisabled || careersByInstitute.length === 0;

  const statusOptions = [
    { value: "active", label: "Activo" },
    { value: "inactive", label: "Inactivo" },
  ];

  return (
    <Card bodyClassName="!bg-surface-bright px-5 py-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Buscar por nombre o email"
          className="flex-1"
        />
        <div className="w-px h-6 bg-outline-variant" />
        <Dropdown
          label="Estado"
          icon="toggle_off"
          value={statusFilter}
          options={statusOptions}
          onChange={onStatusChange}
        />
        <div className="w-px h-6 bg-outline-variant" />
        <Button variant="ghost" onClick={onReset}>
          <span className="material-symbols-outlined text-[24px]">refresh</span>
          Reiniciar
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <InputToggle
          label="Es admin"
          checked={filterIsAdmin}
          onChange={onAdminChange}
        />
        <div className="w-px h-6 bg-outline-variant" />
        <InputToggle
          label="Sin inscripciones"
          checked={filterUnassigned}
          onChange={onUnassignedChange}
        />
        <div className="w-px h-6 bg-outline-variant" />
        <div className={instCareerDisabled ? "opacity-50 pointer-events-none" : ""}>
          <Dropdown
            label="Instituto"
            icon="apartment"
            value={filterInstituteId}
            options={instituteFilterOptions}
            onChange={(value) => {
              onInstituteChange(value);
              if (value && filterUnassigned) onUnassignedChange(false);
            }}
            hideAllOption
          />
        </div>
        <div className="w-px h-6 bg-outline-variant" />
        {filterInstituteId && careersByInstitute.length === 0 ? (
          <div className="flex items-center gap-2 rounded border border-outline-variant bg-white px-4 py-1.5 text-sm font-medium text-on-surface-variant opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined text-[24px] text-outline">school</span>
            <span>Sin carreras</span>
          </div>
        ) : (
          <div className={careerDisabled ? "opacity-50 pointer-events-none" : ""}>
            <Dropdown
              label="Carrera"
              icon="school"
              value={filterCareerId}
              options={careersByInstitute.map((c) => ({ value: c.id, label: c.name }))}
              onChange={onCareerChange}
              hideAllOption
            />
          </div>
        )}
      </div>
    </Card>
  );
}
