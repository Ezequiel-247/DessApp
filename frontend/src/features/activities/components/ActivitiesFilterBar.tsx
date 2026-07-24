import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { Dropdown } from "@/widgets/ui/Dropdown";
import { InputToggle } from "@/widgets/ui/InputToggle";
import type { Career } from "@/entities/Career";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterUnassigned: boolean;
  onUnassignedChange: (checked: boolean) => void;
  filterInstituteId: string;
  onInstituteChange: (value: string) => void;
  instituteFilterOptions: { value: string; label: string }[];
  filterCareerId: string;
  onCareerChange: (value: string) => void;
  careersByInstitute: Career[];
  onReset: () => void;
}

export function ActivitiesFilterBar({
  searchTerm,
  onSearchChange,
  filterUnassigned,
  onUnassignedChange,
  filterInstituteId,
  onInstituteChange,
  instituteFilterOptions,
  filterCareerId,
  onCareerChange,
  careersByInstitute,
  onReset,
}: Props) {
  return (
    <Card bodyClassName="!bg-surface-bright px-5 py-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Buscar por nombre o código"
          className="flex-1"
        />
        <div className="w-px h-6 bg-outline-variant" />
        <Button variant="ghost" onClick={onReset}>
          <span className="material-symbols-outlined text-[24px]">refresh</span>
          Reiniciar
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className={filterUnassigned ? "opacity-50 pointer-events-none" : ""}>
          <Dropdown
            label="Instituto"
            icon="apartment"
            value={filterInstituteId}
            options={instituteFilterOptions}
            onChange={onInstituteChange}
            hideAllOption
          />
        </div>
        <div className="w-px h-6 bg-outline-variant" />
        {!filterInstituteId ? (
          <div className="flex items-center gap-2 rounded border border-outline-variant bg-white px-4 py-1.5 text-sm font-medium text-on-surface-variant opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined text-[24px] text-outline">school</span>
            <span>Sin instituto</span>
          </div>
        ) : careersByInstitute.length === 0 ? (
          <div className="flex items-center gap-2 rounded border border-outline-variant bg-white px-4 py-1.5 text-sm font-medium text-on-surface-variant opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined text-[24px] text-outline">school</span>
            <span>Sin carreras</span>
          </div>
        ) : (
          <div className={filterUnassigned ? "opacity-50 pointer-events-none" : ""}>
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
        <div className="w-px h-6 bg-outline-variant" />
        <InputToggle
          label="No asignadas"
          checked={filterUnassigned}
          onChange={onUnassignedChange}
        />
      </div>
    </Card>
  );
}
