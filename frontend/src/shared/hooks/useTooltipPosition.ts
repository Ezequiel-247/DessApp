import { useRef, useState, useCallback } from "react";

export function useTooltipPosition(estimatedHeight = 200) {
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const triggerRef = useRef<HTMLSpanElement>(null);

  const calculatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setPosition(spaceBelow < estimatedHeight ? "top" : "bottom");
  }, [estimatedHeight]);

  return { triggerRef, position, calculatePosition };
}
