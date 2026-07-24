/**
 * ThemeToggle - Toggle para tema claro/oscuro
 * Stitch Design System - Academic Precision
 */
import { useTheme } from "@/app/ThemeProvider";

export function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`
        relative w-10 h-10
        flex items-center justify-center
        rounded-full
        text-outline
        hover:bg-surface-container-low
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-lowest
        ${className}
      `}
    >
      {isDark ? (
        <span className="material-symbols-outlined text-xl">light_mode</span>
      ) : (
        <span className="material-symbols-outlined text-xl">dark_mode</span>
      )}
    </button>
  );
}