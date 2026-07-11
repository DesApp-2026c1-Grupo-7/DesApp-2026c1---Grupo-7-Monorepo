import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Dashboard.css";
import StatCard from "../../components/StatCard";
import api from "../../services/api";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  LibraryBig,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AcademicRecord {
  estado: string;
}

interface Avance {
  totalMaterias: number;
  aprobadas: number;
  regularizadas: number;
  pendientes: number;
  porcentajeAvance: number;
}

export default function Dashboard() {
  const [userName] = useState<string>(() => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr).nombre ?? "Estudiante" : "Estudiante";
    } catch {
      return "Estudiante";
    }
  });
  const [stats, setStats] = useState({ aprobadas: 0, regular: 0, desaprobadas: 0, pendientes: 0 });
  const [avance, setAvance] = useState<Avance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/academico/situacion"), api.get("/academico/avance")])
      .then(([response, avanceResponse]) => {
        const records: AcademicRecord[] = response.data;
        const counts = records.reduce(
          (acc, curr) => {
            if (curr.estado === "Aprobada" || curr.estado === "Promocion") acc.aprobadas++;
            else if (curr.estado === "Regular") acc.regular++;
            else if (curr.estado === "Desaprobado") acc.desaprobadas++;
            else if (curr.estado === "Pendiente") acc.pendientes++;
            return acc;
          },
          { aprobadas: 0, regular: 0, desaprobadas: 0, pendientes: 0 }
        );
        const avanceData: Avance = avanceResponse.data;
        setAvance(avanceData);
        setStats({
          aprobadas: avanceData.aprobadas ?? counts.aprobadas,
          regular: avanceData.regularizadas ?? counts.regular,
          desaprobadas: counts.desaprobadas,
          pendientes: avanceData.pendientes ?? counts.pendientes
        });
      })
      .catch((error) => { console.error("Error al obtener estadísticas:", error); })
      .finally(() => { setLoading(false); });
  }, []);

  const totalMaterias = avance?.totalMaterias ?? 0;
  const avancePercent = avance?.porcentajeAvance ?? 0;
  const firstName = userName.split(" ")[0];

  const quickActions = [
    {
      to: "/student/situation",
      icon: <BookOpen size={24} />,
      title: "Situación académica",
      description: "Revisá materias, finales y progreso",
      tone: "blue",
    },
    {
      to: "/student/assistant",
      icon: <GraduationCap size={24} />,
      title: "Asistente académico",
      description: "Planificá tu cursada hasta recibirte",
      tone: "purple",
    },
    {
      to: "/student/sessions",
      icon: <Calendar size={24} />,
      title: "Sesiones de estudio",
      description: "Encontrá compañeros para estudiar",
      tone: "green",
    },
    {
      to: "/student/materials",
      icon: <LibraryBig size={24} />,
      title: "Materiales",
      description: "Compartí y valorá recursos por materia",
      tone: "pink",
    },
  ];

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <span className="dashboard-kicker">Tu recorrido académico</span>
          <h1>Hola, {firstName}</h1>
          <p>Todo lo importante de tu carrera, en un solo lugar.</p>
        </div>
        <Link className="dashboard-header-action" to="/student/assistant">
          <Sparkles size={18} />
          Planificar cursada
        </Link>
      </div>

      {/* PROGRESO */}
      <div className="progress-card">
        <div className="progress-header">
          <div>
            <h2>Avance en la Carrera</h2>
            <span>Plan de estudio actual</span>
          </div>
          <TrendingUp size={20} />
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${avancePercent}%` }} />
          </div>
          <span className="progress-percent">{avancePercent}%</span>
        </div>

        <p className="progress-text">
          {stats.aprobadas} de {totalMaterias} materias aprobadas
        </p>
      </div>

      {/* STATS */}

      <div className="stats" aria-label="Resumen académico">
        {loading ? (
          <p>Cargando estadísticas...</p>
        ) : (
          <>
            <StatCard title="Materias Aprobadas" value={stats.aprobadas.toString()} color="green"/> 
            <StatCard title="Regularizadas" value={stats.regular.toString()} color="blue" />
            <StatCard title="Pendientes" value={stats.pendientes.toString()} color="orange" />
          </>
        )}
      </div>

      {/* ACCESOS */}
      <section className="section dashboard-actions">
        <div className="section-heading">
          <div>
            <h2>¿Qué querés hacer hoy?</h2>
            <p>Entrá directo a las herramientas más usadas.</p>
          </div>
        </div>

        <div className="quick-access">
          {quickActions.map((action) => (
            <Link className="quick-card" to={action.to} key={action.to}>
              <span className={`quick-icon ${action.tone}`}>{action.icon}</span>
              <span className="quick-copy">
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
              <ArrowRight className="quick-arrow" size={18} />
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
