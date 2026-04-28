import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Bell,
  User
} from "lucide-react";

import "../styles/Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Sistema Académico</h2>
        <p>Panel Estudiante</p>
      </div>

      <nav className="menu">
        <NavLink to="/student" className="link">
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/student/situation" className="link">
          <BookOpen size={18} />
          Situación Académica
        </NavLink>

        <NavLink to="/student/assistant" className="link">
          <GraduationCap size={18} />
          Asistente Académico
        </NavLink>

        <NavLink to="/student/social" className="link">
          <Users size={18} />
          Red Social
        </NavLink>

        <NavLink to="/student/sessions" className="link">
          <Calendar size={18} />
          Sesiones de Estudio
        </NavLink>

        <NavLink to="/student/materials" className="link">
          <BookOpen size={18} />
          Materiales
        </NavLink>

        <NavLink to="/student/notifications" className="link">
          <Bell size={18} />
          Notificaciones
        </NavLink>

        <NavLink to="/student/profile" className="link">
          <User size={18} />
          Perfil
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;