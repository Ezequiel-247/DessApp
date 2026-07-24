import { useEffect, useRef } from "react";

export function useYearVisibilityObserver(onYearVisible?: (year: number) => void) {
  const lastActiveYear = useRef<number | null>(null);

  useEffect(() => {
    if (!onYearVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const year = parseInt(entry.target.id.replace("year-", ""), 10);
          if (!isNaN(year) && year !== lastActiveYear.current) {
            lastActiveYear.current = year;
            onYearVisible(year);
          }
        }
      },
      { rootMargin: "-20% 0px -75% 0px" }
    );

    const sectionEls = document.querySelectorAll("[id^='year-']");
    sectionEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [onYearVisible]);
}
