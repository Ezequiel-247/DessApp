/**
 * Layout - Layout principal combinando Sidebar + Header
 * Stitch Design System - Academic Precision
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/widgets/layout/Sidebar/Sidebar";
import { Header } from "@/widgets/layout/Header/Header";
import { MobileNav } from "@/widgets/layout/MobileNav/MobileNav";

export function Layout({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-surface-bright">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 md:ml-64 flex flex-col w-full">
        <Header />
        <main className="flex-1 pb-20 md:pb-0 md:p-margin max-w-7xl mx-auto w-full px-gutter md:px-margin relative">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
