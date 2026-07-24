/**
 * MobileNav - Barra de navegación inferior para móvil
 * Nexo - Stitch Design System
 */
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";

const studentNavItems = [
  { label: "Resumen", to: "/student/dashboard", icon: "dashboard" },
  { label: "Noved", to: "/student/novelties", icon: "feed" },
  { label: "Calificaciones", to: "/student/academic-record", icon: "grade" },
  { label: "Mi Progreso", to: "/student/myProgress", icon: "donut_small" },
  { label: "Mi Planificador", to: "/student/myPlanner", icon: "calendar_month" },
  { label: "Mi Perfil", to: "/student/profile", icon: "account_circle" },
];

const adminMainItems = [
  { label: "Dashb.", to: "/admin/dashboard", icon: "dashboard" },
  { label: "Carr.", to: "/admin/careers", icon: "school" },
  { label: "Mater.", to: "/admin/subjects", icon: "subject" },
  { label: "Activ.", to: "/admin/activities", icon: "workspace_premium" },
  { label: "Planes", to: "/admin/plans", icon: "timeline" },
];

const adminMoreItems = [
  { label: "Institutos", to: "/admin/institutes", icon: "apartment" },
  { label: "Directorio", to: "/admin/directory", icon: "group" },
  { label: "Moderación", to: "/admin/moderation", icon: "gavel" },
];

export function MobileNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMore(false);
  };

  const navItems = user?.role === 'admin' ? adminMainItems : studentNavItems;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              location.pathname.startsWith(item.to + "/");

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive
                    ? "text-primary-container"
                    : "text-on-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors text-on-surface-variant hover:text-primary-container"
          >
            <span className="material-symbols-outlined text-2xl">more_horiz</span>
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface-bright rounded-t-xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-outline-variant">
              <h2 className="font-title-sm text-title-sm text-on-surface">Más</h2>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="p-1 hover:bg-surface-container rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-3 space-y-1">
              {adminMoreItems.map((item) => {
                const isActive =
                  location.pathname === item.to ||
                  location.pathname.startsWith(item.to + "/");
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => { navigate(item.to); setShowMore(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-primary/5 text-primary-container font-semibold"
                        : "text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                    <span className="text-body-sm">{item.label}</span>
                  </button>
                );
              })}
              <div className="border-t border-outline-variant pt-1 mt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-on-surface-variant hover:bg-surface-container hover:text-error"
                >
                  <span className="material-symbols-outlined text-[24px]">logout</span>
                  <span className="text-body-sm">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
