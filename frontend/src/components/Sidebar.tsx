import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Bell,
  User,
  ShieldAlert,
  Rss,
  LibraryBig,
  Menu,
  X
} from "lucide-react";

import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import "../styles/Sidebar.css";

interface SidebarItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface SidebarProps {
  role: "student" | "admin";
}

const STUDENT_ITEMS: SidebarItem[] = [
  { to: "/student", icon: <LayoutDashboard size={18} />, label: "Inicio" },
  { to: "/student/situation", icon: <BookOpen size={18} />, label: "Situación Académica" },
  { to: "/student/assistant", icon: <GraduationCap size={18} />, label: "Asistente Académico" },
  { to: "/student/social", icon: <Users size={18} />, label: "Red Social" },
  { to: "/student/feed", icon: <Rss size={18} />, label: "Feed Académico" },
  { to: "/student/sessions", icon: <Calendar size={18} />, label: "Sesiones de Estudio" },
  { to: "/student/materials", icon: <BookOpen size={18} />, label: "Materiales" },
  { to: "/student/notifications", icon: <Bell size={18} />, label: "Notificaciones" },
  { to: "/student/profile", icon: <User size={18} />, label: "Perfil" }
];

const ADMIN_ITEMS: SidebarItem[] = [
  { to: "/admin", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/admin/usuarios", icon: <Users size={18} />, label: "Usuarios" },
  { to: "/admin/carreras", icon: <BookOpen size={18} />, label: "Carreras" },
  { to: "/admin/studyplans", icon: <GraduationCap size={18} />, label: "Planes de Estudio" },
  { to: "/admin/subjects", icon: <Users size={18} />, label: "Materias" },
  { to: "/admin/ofertas", icon: <Calendar size={18} />, label: "Oferta Académica" },
  { to: "/admin/moderation", icon: <ShieldAlert size={18} />, label: "Moderación" }
];

const Sidebar = ({ role }: SidebarProps) => {
  const items = role === "student" ? STUDENT_ITEMS : ADMIN_ITEMS;
  const panelName = role === "student" ? "Panel Estudiante" : "Panel Administrador";
  const unread = useUnreadNotifications(role === "student");

  // Menú hamburguesa para mobile: en pantallas chicas el menú arranca cerrado
  // y se despliega como lista vertical al tocar el botón.
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-mark"><LibraryBig size={20} /></span>
          <div>
            <h2>Sistema Académico</h2>
            <p>{panelName}</p>
          </div>
        </div>

        <button
          className="sidebar-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="menu-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav className={`menu ${menuOpen ? "open" : ""}`}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="link"
            end={item.to === "/student" || item.to === "/admin"}
            onClick={() => setMenuOpen(false)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.to === "/student/notifications" && unread > 0 && (
              <span className="sidebar-badge">{unread > 9 ? "9+" : unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
