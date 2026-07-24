import { useEffect, useState } from "react";
import { getInstitutes, createInstitute, updateInstitute, deleteInstitute } from "@/entities/Institute";
import { useConfirm } from "@/widgets/hooks/useConfirm";

export interface InstituteDraft {
  id: string;
  name: string;
  shortName: string;
  responsible: string;
  email: string;
  tel: string;
  address: string;
  status: "activo" | "en_revision" | "inactivo";
  notes: string;
}

type ValidationErrors = Partial<Record<keyof InstituteDraft, string>>;

const STATUS_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "en_revision", label: "En revisión" },
  { value: "inactivo", label: "Inactivo" },
];

function createDraft(record?: InstituteDraft | null): InstituteDraft {
  return record ?? {
    id: "",
    name: "",
    shortName: "",
    responsible: "",
    email: "",
    tel: "",
    address: "",
    status: "activo",
    notes: "",
  };
}

function validateDraft(draft: InstituteDraft): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!draft.name.trim()) errors.name = "El nombre es obligatorio.";
  if (!draft.shortName.trim()) errors.shortName = "La sigla es obligatoria.";
  if (!draft.responsible.trim()) errors.responsible = "El responsable es obligatorio.";
  if (!draft.address.trim()) errors.address = "La dirección es obligatoria.";

  const emailValue = draft.email.trim();
  if (!emailValue) {
    errors.email = "El email institucional es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    errors.email = "Ingresá un email válido.";
  }

  const telValue = draft.tel.trim();
  if (!telValue) {
    errors.tel = "El teléfono es obligatorio.";
  } else if (!/^\+?[\d\s()-]{8,20}$/.test(telValue)) {
    errors.tel = "Ingresá un teléfono válido.";
  }

  return errors;
}

export function useInstitutesData() {
  const [records, setRecords] = useState<InstituteDraft[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [draft, setDraft] = useState<InstituteDraft>(createDraft(null));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, options, open, close, handleConfirm } = useConfirm();

  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  const filteredRecords = records.filter((record) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesQuery = !q ||
      [record.name, record.shortName, record.responsible, record.email]
        .join(" ").toLowerCase().includes(q);
    const matchesStatus = !statusFilter || record.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const institutesArr = await getInstitutes();
        if (!mounted) return;
        const mapped: InstituteDraft[] = institutesArr.map((ins: any) => ({
          id: ins.id,
          name: ins.name ?? "",
          shortName: ins.shortName ?? "",
          responsible: ins.responsible ?? "",
          email: ins.email ?? "",
          tel: ins.tel ?? "",
          address: ins.address ?? "",
          status: (ins.status || "activo") as InstituteDraft["status"],
          notes: ins.notes ?? "",
        }));
        setRecords(mapped);
        setSelectedRecordId(null);
        setDraft(createDraft(null));
      } catch (err) {
        console.error("Failed to load institutes:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSelect = (id: string) => {
    if (id === selectedRecordId) {
      setSelectedRecordId(null);
      setDraft(createDraft(null));
    } else {
      const record = records.find((r) => r.id === id);
      setSelectedRecordId(id);
      if (record) setDraft(createDraft(record));
    }
    setErrors({});
  };

  const handleNew = () => {
    setSelectedRecordId(null);
    setDraft(createDraft(null));
    setErrors({});
  };

  const handleFieldChange = (field: keyof InstituteDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSave = async () => {
    const validationErrors = validateDraft(draft);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      if (selectedRecordId) {
        await updateInstitute(selectedRecordId, draft);
        setRecords((current) =>
          current.map((r) => (r.id === selectedRecordId ? { ...r, ...draft } : r))
        );
      } else {
        const created = await createInstitute(draft);
        const nextRecord: InstituteDraft = {
          id: created.id,
          name: created.name ?? draft.name,
          shortName: created.shortName ?? draft.shortName,
          responsible: created.responsible ?? draft.responsible,
          email: created.email ?? draft.email,
          tel: created.tel ?? draft.tel,
          address: created.address ?? draft.address,
          status: (created.status || "activo") as InstituteDraft["status"],
          notes: created.notes ?? "",
        };
        setRecords((current) => [nextRecord, ...current]);
        setSelectedRecordId(nextRecord.id);
      }
    } catch (err: any) {
      console.error("Failed to save institute:", err);
      alert(err.message || "No se pudo guardar el instituto");
    }
  };

  const handleDelete = (recordId: string) => {
    const record = records.find((r) => r.id === recordId);
    open({
      title: "Eliminar instituto",
      description: `¿Confirmás eliminar ${record?.name ?? "el instituto"}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteInstitute(recordId);
          const remaining = records.filter((r) => r.id !== recordId);
          setRecords(remaining);
          if (selectedRecordId === recordId) {
            setSelectedRecordId(remaining[0]?.id ?? null);
            setDraft(createDraft(remaining[0] ?? null));
          }
          setErrors({});
        } catch (err: any) {
          console.error("Failed to delete institute:", err);
          setErrors({ api: err.message || "No se pudo eliminar el instituto" } as any);
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  return {
    records,
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
  };
}
