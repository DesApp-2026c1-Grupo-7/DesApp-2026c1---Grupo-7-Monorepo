import { useEffect, useState } from "react";
import "../../styles/Dashboard.css";
import StatCard from "../../components/StatCard";
import api from "../../services/api";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  TrendingUp,
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
  const [stats, setStats] = useState({ aprobadas: 0, regular: 0, pendientes: 0 });
  const [avance, setAvance] = useState<Avance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/academico/situacion"), api.get("/academico/avance")])
      .then(([response, avanceResponse]) => {
        const records: AcademicRecord[] = response.data;
        const counts = records.reduce(
          (acc, curr) => {
            if (curr.estado === "Aprobada") acc.aprobadas++;
            else if (curr.estado === "Regular") acc.regular++;
            else if (curr.estado === "Pendiente") acc.pendientes++;
            return acc;
          },
          { aprobadas: 0, regular: 0, pendientes: 0 }
        );
        const avanceData: Avance = avanceResponse.data;
        setAvance(avanceData);
        setStats({
          aprobadas: avanceData.aprobadas ?? counts.aprobadas,
          regular: avanceData.regularizadas ?? counts.regular,
          pendientes: avanceData.pendientes ?? counts.pendientes
        });
      })
      .catch((error) => { console.error("Error al obtener estadísticas:", error); })
      .finally(() => { setLoading(false); });
  }, []);

  const totalMaterias = avance?.totalMaterias ?? 0;
  const avancePercent = avance?.porcentajeAvance ?? 0;

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bienvenido, {userName}</p>
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

      <div className="stats">
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
      <div className="section">
        <h2>Accesos Rápidos</h2>

        <div className="quick-access">
          <div className="quick-card">
            <BookOpen size={28} className="blue" />
            <span>Situación Académica</span>
          </div>

          <div className="quick-card">
            <GraduationCap size={28} className="purple" />
            <span>Asistente Académico</span>
          </div>

          <div className="quick-card">
            <Calendar size={28} className="green" />
            <span>Sesiones de Estudio</span>
          </div>

          <div className="quick-card">
            <Users size={28} className="pink" />
            <span>Red Social</span>
          </div>
        </div>
      </div>

      {/* EVENTOS */}
      <div className="section">
        <h2>Próximos Eventos</h2>

        <div className="events">
          <div className="event blue">
            <div className="date">
              <span>15</span>
              <small>MAY</small>
            </div>
            <div>
              <h4>Final de Algoritmos y Estructuras</h4>
              <p>10:00 AM - Aula 305</p>
            </div>
          </div>

          <div className="event green">
            <div className="date">
              <span>18</span>
              <small>MAY</small>
            </div>
            <div>
              <h4>Sesión de Estudio: Base de Datos</h4>
              <p>16:00 PM - Biblioteca</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
