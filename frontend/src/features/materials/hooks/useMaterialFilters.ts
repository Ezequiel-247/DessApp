import { useState, useCallback } from "react";
import type { MaterialFilters, SortOption } from "@/entities/Material";

interface UseFiltersOptions {
  studentId?: string;
}

export function useMaterialFilters({ studentId }: UseFiltersOptions = {}) {
  const [selectedCareerIds, setSelectedCareerIds] = useState<Set<string>>(new Set());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>("new");
  const [query, setQuery] = useState<string>("");

  const toggleCareer = useCallback((careerId: string) => {
    setSelectedCareerIds((prev) => {
      const next = new Set(prev);
      if (next.has(careerId)) next.delete(careerId);
      else next.add(careerId);
      return next;
    });
    // reset subject filter on career change
    setSelectedSubjectId(undefined);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCareerIds(new Set());
    setSelectedSubjectId(undefined);
    setSort("new");
    setQuery("");
  }, []);

  const activeFilterCount =
    selectedCareerIds.size +
    (selectedSubjectId ? 1 : 0) +
    (sort !== "new" ? 1 : 0) +
    (query ? 1 : 0);

  const buildApiFilters = (): MaterialFilters => {
    const filters: MaterialFilters = {
      sort,
      viewerStudentId: studentId,
    };
    if (query.trim()) filters.q = query.trim();

    if (selectedCareerIds.size === 1) {
      // Single career — pass career_id directly
      filters.careerId = Array.from(selectedCareerIds)[0];
    } else if (selectedCareerIds.size === 0 && studentId) {
      // No filter selected → all enrolled careers (backend resolves via student_id)
      filters.studentId = studentId;
    }
    // Multiple careers: also pass student_id and let backend handle all
    if (selectedCareerIds.size > 1 && studentId) {
      filters.studentId = studentId;
    }

    if (selectedSubjectId) filters.subjectId = selectedSubjectId;

    return filters;
  };

  return {
    selectedCareerIds,
    selectedSubjectId,
    sort,
    query,
    activeFilterCount,
    toggleCareer,
    setSelectedSubjectId,
    setSort,
    setQuery,
    clearFilters,
    buildApiFilters,
  };
}
