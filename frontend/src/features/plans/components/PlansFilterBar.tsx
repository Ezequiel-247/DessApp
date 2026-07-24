import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { Dropdown } from "@/widgets/ui/Dropdown";
import type { Institute } from "@/entities/Institute/model/institute";
import type { Career } from "@/entities/Career/model/career";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedInstitute: string;
  onInstituteChange: (value: string) => void;
  institutes: Institute[];
  selectedCareer: string;
  onCareerChange: (value: string) => void;
  filteredCareers: Career[];
  onReset: () => void;
}

export function PlansFilterBar({
  searchTerm,
  onSearchChange,
  selectedInstitute,
  onInstituteChange,
  institutes,
  selectedCareer,
  onCareerChange,
  filteredCareers,
  onReset,
}: Props) {
  const careerDisabled = filteredCareers.length === 0;

  return (
    <Card bodyClassName="!bg-surface-bright px-5 py-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Buscar por nombre de plan"
          className="flex-1"
        />
        <div className="w-px h-6 bg-outline-variant" />
        <Button variant="ghost" onClick={onReset}>
          <span className="material-symbols-outlined text-[24px]">refresh</span>
          Reiniciar
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Dropdown
          label="Instituo"
          icon="apartment"
          value={selectedInstitute}
          options={institutes.map((i) => ({ value: i.id, label: i.name }))}
          onChange={onInstituteChange}
          hideAllOption
        />
        <div className="w-px h-6 bg-outline-variant" />
        {filteredCareers.length === 0 ? (
          <div className="flex items-center gap-2 rounded border border-outline-variant bg-white px-4 py-1.5 text-sm font-medium text-on-surface-variant opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined text-[24px] text-outline">school</span>
            <span>Sin carreras</span>
          </div>
        ) : (
          <div className={careerDisabled ? "opacity-50 pointer-events-none" : ""}>
            <Dropdown
              label="Carrera"
              icon="school"
              value={selectedCareer}
              options={filteredCareers.map((c) => ({ value: c.id, label: c.name }))}
              onChange={onCareerChange}
              hideAllOption
            />
          </div>
        )}
      </div>
    </Card>
  );
}
