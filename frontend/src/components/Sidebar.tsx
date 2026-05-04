import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Bell,
  User,
  ShieldAlert
} from "lucide-react";

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
  { to: "/student", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/student/situation", icon: <BookOpen size={18} />, label: "Situación Académica" },
  { to: "/student/assistant", icon: <GraduationCap size={18} />, label: "Asistente Académico" },
  { to: "/student/social", icon: <Users size={18} />, label: "Red Social" },
  { to: "/student/sessions", icon: <Calendar size={18} />, label: "Sesiones de Estudio" },
  { to: "/student/materials", icon: <BookOpen size={18} />, label: "Materiales" },
  { to: "/student/notifications", icon: <Bell size={18} />, label: "Notificaciones" },
  { to: "/student/profile", icon: <User size={18} />, label: "Perfil" },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { to: "/admin", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/admin/carreras", icon: <BookOpen size={18} />, label: "Carreras" },
  { to: "/admin/studyplans", icon: <GraduationCap size={18} />, label: "Planes de Estudio" },
  { to: "/admin/subjects", icon: <Users size={18} />, label: "Materias" },
  { to: "/admin/moderation", icon: <ShieldAlert size={18} />, label: "Moderación" },
];

const Sidebar = ({ role }: SidebarProps) => {
  const items = role === "student" ? STUDENT_ITEMS : ADMIN_ITEMS;
  const panelName = role === "student" ? "Panel Estudiante" : "Panel Administrador";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Sistema Académico</h2>
        <p>{panelName}</p>
      </div>

      <nav className="menu">
        {items.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            className="link"
            end={item.to === "/student" || item.to === "/admin"}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
