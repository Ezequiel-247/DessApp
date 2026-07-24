import { useEffect, useState, useMemo } from "react";
import type { CareerDraft, Institute } from "./useCareersData";

export function useCareersFilter(careers: CareerDraft[], institutes: Institute[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstituteId, setFilterInstituteId] = useState("");

  useEffect(() => {
    if (institutes.length > 0 && !filterInstituteId) {
      setFilterInstituteId(String(institutes[0].id));
    }
  }, [institutes]);

  const formatInstituteName = (instituteId: string) =>
    institutes.find((i) => i.id === instituteId)?.name ?? "Instituto no definido";

  const resetFilters = () => {
    setSearchTerm("");
    setFilterInstituteId(String(institutes[0]?.id ?? ""));
  };

  const filteredCareers = useMemo(() => {
    return careers.filter((career) => {
      const normalizedQuery = searchTerm.trim().toLowerCase();
      const matchSearch =
        !normalizedQuery ||
        [career.name, career.degreeTitle, formatInstituteName(career.instituteId)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchInstitute =
        !filterInstituteId || career.instituteId === filterInstituteId;
      return matchSearch && matchInstitute;
    });
  }, [careers, searchTerm, filterInstituteId, formatInstituteName]);

  return {
    searchTerm,
    setSearchTerm,
    filterInstituteId,
    setFilterInstituteId,
    filteredCareers,
    formatInstituteName,
    resetFilters,
  };
}
