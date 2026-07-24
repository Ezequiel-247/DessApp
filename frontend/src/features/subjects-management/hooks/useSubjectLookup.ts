import { useState, useEffect } from "react";
import type { Subject } from "@/entities/Subject";

export type LookupState = "idle" | "checking" | "exists" | "not-found";

export function useSubjectLookup(
  subjects: Subject[],
  code: string,
  enabled: boolean
) {
  const [existingSubject, setExistingSubject] = useState<Subject | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");

  useEffect(() => {
    if (!enabled || !code.trim()) {
      setExistingSubject(null);
      setLookupState("idle");
      return;
    }
    setLookupState("checking");
    const timer = setTimeout(() => {
      const found = subjects.find(
        (s) => s.code.toLowerCase() === code.trim().toLowerCase()
      );
      setExistingSubject(found ?? null);
      setLookupState(found ? "exists" : "not-found");
    }, 400);
    return () => clearTimeout(timer);
  }, [subjects, code, enabled]);

  return { existingSubject, lookupState };
}
