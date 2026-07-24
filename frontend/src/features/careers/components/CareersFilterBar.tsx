import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { Dropdown } from "@/widgets/ui/Dropdown";
import type { Institute } from "../hooks/useCareersData";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterInstituteId: string;
  onInstituteChange: (value: string) => void;
  onReset: () => void;
  institutes: Institute[];
}

export function CareersFilterBar({ searchTerm, onSearchChange, filterInstituteId, onInstituteChange, onReset, institutes }: Props) {
  return (
    <Card className="w-fit" bodyClassName="!bg-surface-bright px-5 py-3 flex items-center gap-3">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por nombre, título o instituto"
        className="w-[300px] md:w-[400px]"
      />
      <div className="w-px h-6 bg-outline-variant" />
      <Dropdown
        label="Instituto"
        icon="apartment"
        value={filterInstituteId}
        options={institutes.map((i) => ({ value: i.id, label: i.name }))}
        onChange={onInstituteChange}
        hideAllOption
      />
      <div className="w-px h-6 bg-outline-variant" />
      <Button variant="ghost" onClick={onReset}>
        <span className="material-symbols-outlined text-[24px]">refresh</span>
        Reiniciar
      </Button>
    </Card>
  );
}
