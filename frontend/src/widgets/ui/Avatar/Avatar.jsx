/**
 * Avatar - Imagen de perfil con fallback
 * Stitch Design System - Academic Precision
 */
export function Avatar({
  src = '',
  alt = '',
  size = 'md',
  name = ''
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`
      ${sizes[size]}
      rounded-full overflow-hidden
      bg-surface-container flex items-center justify-center
      border-4 border-surface-container-lowest
      text-on-surface-variant font-medium
    `}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="material-symbols-outlined text-on-surface-variant">{getInitials(name)}</span>
      )}
    </div>
  );
}