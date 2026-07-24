import { useState, useCallback } from "react";

export type AccordionKey =
  | { type: "year"; id: number }
  | { type: "credit"; id: string };

export function useAccordion(initial: AccordionKey | null = null) {
  const [activeAccordion, setActiveAccordion] = useState<AccordionKey | null>(initial);

  const toggleAccordion = useCallback((key: AccordionKey) => {
    setActiveAccordion((prev) => {
      if (prev && prev.type === key.type && prev.id === key.id) return null;
      return key;
    });
  }, []);

  const setAccordion = useCallback((key: AccordionKey) => {
    setActiveAccordion(key);
  }, []);

  return { activeAccordion, toggleAccordion, setAccordion };
}
