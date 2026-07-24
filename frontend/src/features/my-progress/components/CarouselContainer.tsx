import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Card } from "@/widgets/ui/Card";

export interface CarouselItem {
  id: string;
  component: ReactNode;
}

interface Props {
  items: CarouselItem[];
  dotsPosition?: "bottom" | "top";
  autoPlayInterval?: number;
  minHeight?: string;
  storageKey?: string;
}

export function CarouselContainer({
  items,
  dotsPosition = "bottom",
  autoPlayInterval = 0,
  minHeight = "140px",
  storageKey,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved != null) {
          const parsed = Number(saved);
          if (!isNaN(parsed) && parsed >= 0 && parsed < items.length) return parsed;
        }
      } catch {}
    }
    return 0;
  });

  const clampedIndex = Math.min(activeIndex, items.length - 1);

  useEffect(() => {
    if (autoPlayInterval <= 0 || items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlayInterval, items.length]);

  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(clampedIndex));
      } catch {}
    }
  }, [clampedIndex, storageKey]);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const dots = (
    <div className="flex gap-1.5 justify-center mt-2">
      {items.map((_, i) => (
        <button
          key={i}
          aria-label={`Ver estadística ${i + 1} de ${items.length}`}
          onClick={() => goTo(i)}
          className={`rounded-full transition-all duration-300 cursor-pointer ${
            i === clampedIndex
              ? "bg-primary w-8 h-4"
              : "bg-primary/25 hover:bg-primary/50 w-4 h-4"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ minHeight }}>
      {dotsPosition === "top" && items.length > 1 && dots}
      <Card className="flex flex-col flex-1" bodyClassName="flex flex-col flex-1">
        {items[clampedIndex]?.component}
      </Card>
      {dotsPosition === "bottom" && items.length > 1 && dots}
    </div>
  );
}
