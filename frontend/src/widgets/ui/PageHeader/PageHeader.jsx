/**
 * PageHeader - Encabezado de pagina con acciones opcionales
 */
/** @typedef {import("react").ReactNode} ReactNode */
/**
 * @typedef {Object} PageHeaderProps
 * @property {string} [eyebrow]
 * @property {string} [title]
 * @property {string} [description]
 * @property {ReactNode} [actions]
 * @property {string} [className]
 * @property {string} [eyebrowClassName]
 * @property {string} [titleClassName]
 * @property {string} [descriptionClassName]
 */
export function PageHeader(
  /** @type {PageHeaderProps} */ {
    eyebrow = "",
    title = "",
    description = "",
    actions = null,
    className = "",
    eyebrowClassName = "",
    titleClassName = "",
    descriptionClassName = "",
  }
) {
  return (
    <header className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${className}`}>
      <div className="space-y-2">
        {eyebrow ? (
          <p
            className={`font-label-caps text-label-caps uppercase tracking-wider text-primary-container ${eyebrowClassName}`}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h1 className={`font-display-lg text-display-lg text-on-surface ${titleClassName}`}>
            {title}
          </h1>
        ) : null}
        {description ? (
          <p className={`max-w-3xl font-body-md text-body-md text-on-surface-variant ${descriptionClassName}`}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
