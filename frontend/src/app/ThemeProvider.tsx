/**
 * ThemeProvider - Contexto para tema claro/oscuro
 * Migrated from context/ThemeContext.jsx
 * Stitch Design System - Academic Precision
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';

const ThemeContext = createContext({
  isDark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isDark = false;

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const toggle = () => {};

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}