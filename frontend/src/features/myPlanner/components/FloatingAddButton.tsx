interface Props {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: Props) {
  return (
    <div className="relative group pointer-events-auto">
      <button
        onClick={onClick}
        aria-label="Crear nuevo plan"
        className="w-12 h-12 bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-inverse-surface px-3 py-1.5 text-xs font-medium text-inverse-on-surface opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
      >
        Creá otro plan acá
      </span>
    </div>
  );
}
