/**
 * SectionCard - Contenedor con header opcional
 * @param {object} props
 * @param {React.ReactNode} [props.header]
 * @param {string} [props.title]
 * @param {string} [props.icon]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {string} [props.headerClassName]
 * @param {string} [props.bodyClassName]
 */
export function SectionCard({
  header = null,
  title = "",
  icon = "",
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
}) {
  const resolvedHeader = header || (title
    ? (
        <div className="flex items-center gap-sm">
          {icon ? <span className="material-symbols-outlined text-on-surface-variant">{icon}</span> : null}
          <h3 className="text-title-sm font-semibold text-on-surface">{title}</h3>
        </div>
      )
    : null);

  return (
    <section
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(15,76,92,0.03)] overflow-hidden ${className}`}
    >
      {resolvedHeader ? (
        <div className={`border-b border-outline-variant bg-surface-bright p-gutter ${headerClassName}`}>
          {resolvedHeader}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
