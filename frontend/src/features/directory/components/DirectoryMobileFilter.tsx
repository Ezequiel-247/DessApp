import { SearchInput } from "@/widgets/ui/SearchInput";
import { InputToggle } from "@/widgets/ui/InputToggle";
import { Button } from "@/widgets/ui/Button";
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
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];

export function DirectoryMobileFilter({
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

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por nombre o email"
        className="w-full"
      />

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Estado</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <InputToggle
          label="Es admin"
          checked={filterIsAdmin}
          onChange={onAdminChange}
        />
        <InputToggle
          label="Sin inscripciones"
          checked={filterUnassigned}
          onChange={onUnassignedChange}
        />
      </div>

      <div className={`flex flex-col gap-1 ${instCareerDisabled ? "opacity-50 pointer-events-none" : ""}`}>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Instituto</span>
        <select
          value={filterInstituteId}
          onChange={(e) => onInstituteChange(e.target.value)}
          className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
          disabled={instCareerDisabled}
        >
          {instituteFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className={`flex flex-col gap-1 ${careerDisabled ? "opacity-50 pointer-events-none" : ""}`}>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Carrera</span>
        {!filterInstituteId ? (
          <div className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface-variant opacity-50">
            Sin instituto
          </div>
        ) : careersByInstitute.length === 0 ? (
          <div className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface-variant opacity-50">
            Sin carreras
          </div>
        ) : (
          <select
            value={filterCareerId}
            onChange={(e) => onCareerChange(e.target.value)}
            className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
            disabled={careerDisabled}
          >
            {careersByInstitute.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <Button variant="secondary" onClick={onReset} className="w-full">
        <span className="material-symbols-outlined text-[24px]">refresh</span>
        Reiniciar
      </Button>
    </div>
  );
}
