import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { Dropdown } from "@/widgets/ui/Dropdown";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  onReset: () => void;
}

export function InstitutesFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  onReset,
}: Props) {
  return (
    <Card className="w-fit" bodyClassName="!bg-surface-bright px-5 py-3 flex items-center gap-3">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por nombre, sigla o responsable"
        className="max-w-sm"
      />
      <div className="w-px h-6 bg-outline-variant" />
      <Dropdown
        label="Estado"
        icon="flag"
        value={statusFilter}
        options={statusOptions}
        onChange={onStatusChange}
      />
      <div className="w-px h-6 bg-outline-variant" />
      <Button variant="ghost" onClick={onReset}>
        <span className="material-symbols-outlined text-[24px]">refresh</span>
        Reiniciar
      </Button>
    </Card>
  );
}
