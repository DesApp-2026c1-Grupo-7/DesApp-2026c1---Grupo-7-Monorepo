import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Calendar
} from "lucide-react";

import "../styles/Sidebar.css";

const AdminSidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Sistema Académico</h2>
        <p>Panel Administrador</p>
      </div>

      <nav className="menu">
        <NavLink to="/admin" className="link">
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/admin/carreras" className="link">
          <BookOpen size={18} />
          Carreras
        </NavLink>

        <NavLink to="/admin/studyplans" className="link">
          <GraduationCap size={18} />
          Planes de Estudio
        </NavLink>

        <NavLink to="/admin/subjects" className="link">
          <Users size={18} />
          Materias
        </NavLink>

        <NavLink to="/admin/moderation" className="link">
          <Calendar size={18} />
          Moderación
        </NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;