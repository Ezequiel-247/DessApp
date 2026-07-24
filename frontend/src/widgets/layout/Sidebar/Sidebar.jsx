/**
 * Sidebar - Navegación lateral con branding Nexo
 * Stitch Design System - Academic Precision
 */
import { useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";

const studentNavItems = [
  { label: "Resumen", to: "/student/dashboard", icon: "dashboard" },
  { label: "Calificaciones", to: "/student/academic-record", icon: "grade" },
  { label: "Mi Progreso", to: "/student/myProgress", icon: "donut_small" },
  { label: "Mi Planificador", to: "/student/myPlanner", icon: "calendar_month" },
  { label: "Materiales", to: "/student/materials", icon: "menu_book" },
  { label: "Sesiones", to: "/student/sessions", icon: "groups" },
  { label: "Conexiones", to: "/student/connections", icon: "hub" },
  { label: "Novedades", to: "/student/novelties", icon: "feed" },
  { label: "Mi Perfil", to: "/student/profile", icon: "account_circle" },
];

const adminNavItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "dashboard" },
  { label: "Institutos", to: "/admin/institutes", icon: "apartment" },
  { label: "Carreras", to: "/admin/careers", icon: "school" },
  { label: "Planes", to: "/admin/plans", icon: "timeline" },
  { label: "Materias", to: "/admin/subjects", icon: "subject" },
  { label: "Actividades", to: "/admin/activities", icon: "workspace_premium" },
  { label: "Directorio", to: "/admin/directory", icon: "group" },
  { label: "Moderación", to: "/admin/moderation", icon: "gavel" },
];

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const navigationRef = useRef(null);

  const role = user?.role || '';
  const navItems = role === 'admin' ? adminNavItems : studentNavItems;

  useEffect(() => {
    if (navigationRef.current) {
      navigationRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <aside className="bg-[#0F4C5C] fixed left-0 top-0 h-screen w-64 border-r border-teal-800 shadow-xl flex flex-col py-6 z-50 font-sans text-sm font-medium tracking-wide">
      {/* Brand */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-widest leading-tight">
              Nexo
            </h1>
            <p className="text-teal-100/70 text-xs">
              Trayectoria académica
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navigationRef} className="flex-1 overflow-y-auto flex flex-col gap-1 px-0">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + "/");

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={
                isActive
                  ? "bg-white/10 text-white border-l-4 border-white py-3 px-6 flex items-center gap-3 transition-all"
                  : "text-teal-100/70 hover:text-white py-3 px-6 flex items-center gap-3 transition-all hover:bg-white/5 border-l-4 border-transparent"
              }
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="mt-auto px-0 pt-4">
        <div className="h-px bg-white/10 w-full mb-4 mx-6"></div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full text-teal-100/70 hover:text-white py-3 px-6 flex items-center gap-3 transition-all hover:bg-white/5 border-l-4 border-transparent"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
