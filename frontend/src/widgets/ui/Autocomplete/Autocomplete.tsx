import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export interface AutocompleteOption {
  value: string;
  label: string;
  searchText: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
  disabled?: boolean;
  noResultsMessage?: string;
  className?: string;
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  icon = "search",
  disabled = false,
  noResultsMessage = "Sin resultados",
  className = "",
}: AutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchTerm?.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    return options.filter((o) =>
      o.searchText.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  useEffect(() => {
    setSearchTerm(null);
  }, [value]);

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
        setSearchTerm(value ? null : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setActiveIndex(-1);
    if (val.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (opt: AutocompleteOption) => {
    onChange(opt.value);
    setSearchTerm(null);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && filteredOptions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        e.preventDefault();
        break;
      case "ArrowUp":
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        e.preventDefault();
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        }
        e.preventDefault();
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        setSearchTerm(value ? null : "");
        e.preventDefault();
        break;
    }
  };

  const handleFocus = () => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
      if (inputRef.current) {
        inputRef.current.select();
      }
    } else if (searchTerm === null) {
      setSearchTerm("");
    }
  };

  const handleBlur = () => {
    if (value) {
      setSearchTerm(null);
    } else {
      setSearchTerm("");
    }
  };

  const inputDisplayValue =
    searchTerm !== null ? searchTerm : (selectedOption?.label ?? "");

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        {icon && (
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            style={{ fontSize: "24px" }}
          >
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputDisplayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full rounded border border-outline-variant
            bg-surface-container-lowest px-4 py-3
            ${icon ? "pl-11" : "pl-4"} pr-4
            text-sm text-on-surface outline-none transition-colors
            focus:border-primary focus:ring-2 focus:ring-primary/15
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div
          style={dropdownStyle}
          className="bg-white border border-outline-variant rounded shadow-lg overflow-hidden"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
              {noResultsMessage}
            </div>
          ) : (
            <div
              className="overflow-y-auto max-h-[320px] max-lg:max-h-[270px] max-sm:max-h-[200px]"
              onMouseDown={(e) => e.preventDefault()}
            >
              {filteredOptions.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseDown={() => handleSelect(opt)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2
                    ${idx === activeIndex ? "bg-surface-container" : ""}
                    ${opt.value === value ? "bg-primary/5 text-primary font-semibold" : "text-on-surface"}
                    hover:bg-surface-container
                    max-sm:py-3
                  `}
                >
                  {opt.value === value && (
                    <span className="material-symbols-outlined shrink-0" style={{ fontSize: "16px" }}>
                      check
                    </span>
                  )}
                  <span className={opt.value === value ? "" : "ml-6"}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
