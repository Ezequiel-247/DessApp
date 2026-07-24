import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTooltipPosition } from "@/shared/hooks/useTooltipPosition";

export function Tooltip({ content, children, className = '' }) {
  const { triggerRef, position, calculatePosition } = useTooltipPosition();
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0, bottom: 0 });
  const hideTimeoutRef = useRef(null);

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      left: rect.left + 24,
      top: rect.bottom + 4,
      bottom: window.innerHeight - rect.top + 4,
    });
  }, [triggerRef]);

  const show = useCallback((fromTooltip = false) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (!fromTooltip) {
      calculatePosition();
      updateCoords();
    }
    setIsVisible(true);
  }, [calculatePosition, updateCoords]);

  const hide = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 100);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const style = position === "top"
    ? { left: coords.left, bottom: coords.bottom, position: "fixed" }
    : { left: coords.left, top: coords.top, position: "fixed" };

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative inline-flex ${className}`}
        onMouseEnter={() => show(false)}
        onMouseLeave={hide}
      >
        {children}
      </span>
      {isVisible && content && createPortal(
        <div
          style={style}
          className="z-50 bg-white border border-outline-variant p-3 rounded-lg shadow-xl text-[11px] min-w-[200px]"
          onMouseEnter={() => show(true)}
          onMouseLeave={hide}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
