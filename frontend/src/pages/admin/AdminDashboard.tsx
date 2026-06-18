import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Flag,
  GraduationCap,
  LibraryBig,
  Users,
} from "lucide-react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

interface UserAccount {
  role: "student" | "admin";
  suspendido?: boolean;
}

interface Report {
  estado: "pendiente" | "revisado" | "ignorado";
}

interface DashboardStats {
  students: number;
  careers: number;
  subjects: number;
  pendingReports: number;
}

const EMPTY_STATS: DashboardStats = {
  students: 0,
  careers: 0,
  subjects: 0,
  pendingReports: 0,
};

const ADMIN_ACTIONS = [
  { to: "/admin/usuarios", label: "Gestionar usuarios", description: "Roles, accesos y estados", icon: Users },
  { to: "/admin/carreras", label: "Configurar carreras", description: "Carreras y datos institucionales", icon: BookOpen },
  { to: "/admin/studyplans", label: "Planes de estudio", description: "Requisitos, materias y correlativas", icon: GraduationCap },
  { to: "/admin/moderation", label: "Revisar moderación", description: "Denuncias y contenido reportado", icon: Flag },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/usuarios"),
      api.get("/carreras"),
      api.get("/materias"),
      api.get("/denuncias"),
    ])
      .then(([usersResponse, careersResponse, subjectsResponse, reportsResponse]) => {
        if (!active) return;
        const users = usersResponse.data as UserAccount[];
        const reports = reportsResponse.data as Report[];
        setStats({
          students: users.filter((user) => user.role === "student" && !user.suspendido).length,
          careers: careersResponse.data.length,
          subjects: subjectsResponse.data.length,
          pendingReports: reports.filter((report) => report.estado === "pendiente").length,
        });
      })
      .catch(() => {
        if (active) setError("No se pudo actualizar el resumen del sistema.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const statItems = [
    { value: stats.students, label: "Estudiantes activos", tone: "blue" },
    { value: stats.careers, label: "Carreras", tone: "purple" },
    { value: stats.subjects, label: "Materias", tone: "green" },
    { value: stats.pendingReports, label: "Denuncias pendientes", tone: "warning" },
  ];

  return (
    <div className="admin-container admin-dashboard">
      <div className="admin-dashboard-heading">
        <div>
          <span className="admin-dashboard-kicker">Resumen institucional</span>
          <h1>Panel de Administración</h1>
          <p>Datos actuales y accesos para gestionar la plataforma.</p>
        </div>
        <span className="system-status"><span /> Sistema operativo</span>
      </div>

      {error && <div className="admin-dashboard-alert">{error}</div>}

      <div className="admin-dashboard-stats" aria-label="Resumen del sistema">
        {statItems.map((item) => (
          <div className={`admin-stat ${item.tone}`} key={item.label}>
            <strong>{loading ? "—" : item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <section className="admin-dashboard-section">
        <div className="admin-section-title">
          <div>
            <h2>Gestión rápida</h2>
            <p>Ingresá directamente al módulo que necesitás.</p>
          </div>
        </div>

        <div className="admin-action-grid">
          {ADMIN_ACTIONS.map(({ to, label, description, icon: Icon }) => (
            <Link className="admin-action" to={to} key={to}>
              <span className="admin-action-icon"><Icon size={21} /></span>
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-platform-card">
        <span className="admin-platform-icon"><LibraryBig size={24} /></span>
        <div>
          <h2>Configuración académica centralizada</h2>
          <p>Las carreras, planes, materias y ofertas comparten una única fuente de datos.</p>
        </div>
        <Link to="/admin/ofertas">Ver oferta académica <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
