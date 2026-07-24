/**
 * PillButton - Boton compacto estilo pill
 */
export function PillButton({ tone = "neutral", className = "", children, ...props }) {
  const tones = {
    neutral:
      "rounded-full border border-outline-variant px-3 py-1 font-label-caps text-[10px] text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container",
    danger:
      "rounded-full border border-error/30 px-3 py-1 font-label-caps text-[10px] text-error transition-colors hover:bg-error-container/70",
  };

  return (
    <button type="button" className={`${tones[tone]} ${className}`} {...props}>
      {children}
    </button>
  );
}
