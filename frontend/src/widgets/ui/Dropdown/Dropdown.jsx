import { useState, useRef, useEffect } from "react";

export function Dropdown({
  label,
  icon,
  allLabel = "Todos",
  allValue = "",
  value,
  options,
  onChange,
  className = "",
  hideAllOption = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (measureRef.current) {
      setMeasuredWidth(measureRef.current.offsetWidth);
    }
  }, [options, icon]);

  const allOptions = hideAllOption ? options : [{ value: allValue, label: allLabel }, ...options];
  const isInactive = hideAllOption ? false : (!value || value === allValue);
  const selectedOption = options.find((o) => o.value === value);
  const displayText = isInactive ? label : (selectedOption?.label ?? "");

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ minWidth: isOpen && measuredWidth ? `${measuredWidth}px` : undefined }}
        className={`flex items-center gap-2 rounded border border-outline-variant bg-white px-4 py-1.5 text-sm font-medium text-on-surface transition-all duration-300 hover:bg-surface-container-low/50 max-w-full ${
          isOpen ? "ring-2 ring-primary/15 border-primary-container" : ""
        }`}
      >
        {icon && (
          <span className="material-symbols-outlined " style={{ fontSize: "24px" }}>
            {icon}
          </span>
        )}
        <span className="flex-1 min-w-0 text-left truncate">{displayText}</span>
        <div className="flex items-center ms-3 gap-1">
            {!isInactive && !hideAllOption && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(allValue); setIsOpen(false); }}
              className="flex items-center justify-center cursor-pointer text-outline hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
            </span>
          )}
          <span
            className={`material-symbols-outlined text-outline transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            style={{ fontSize: "20px" }}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Wrapper de tamaño 0 + overflow-hidden: recorta el contenido de medición para que
          nunca empuje el ancho de la página (measureRef sigue reportando su ancho
          intrínseco vía offsetWidth aunque esté clippeado por el padre). */}
      <div className="absolute w-0 h-0 overflow-hidden pointer-events-none invisible">
        <div ref={measureRef} className="flex flex-col">
          {allOptions.map((o) => (
            <div key={String(o.value)} className="flex items-center gap-2 px-4 py-1.5">
              {icon && <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{icon}</span>}
              <span className="whitespace-nowrap">{o.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>expand_more</span>
            </div>
          ))}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-30 top-full mt-1 left-0 w-full min-w-[160px] bg-white border border-outline-variant rounded shadow-lg overflow-hidden">
          {allOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 hover:bg-surface-container ${
                  isSelected
                    ? "bg-primary/5 text-primary font-semibold"
                    : "text-on-surface"
                }`}
              >
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span>
                )}
                <span className={isSelected ? "" : "ml-[24px]"}>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
