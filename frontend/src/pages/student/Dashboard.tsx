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

export default function Dashboard() {
  const [userName, setUserName] = useState("Estudiante");
  const [stats, setStats] = useState({ aprobadas: 0, regular: 0, pendientes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.nombre);
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/academico/situacion");
      const records: AcademicRecord[] = response.data;
      
      const counts = records.reduce((acc, curr) => {
        if (curr.estado === 'Aprobada') acc.aprobadas++;
        else if (curr.estado === 'Regular') acc.regular++;
        else if (curr.estado === 'Pendiente') acc.pendientes++;
        return acc;
      }, { aprobadas: 0, regular: 0, pendientes: 0 });

      setStats(counts);
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalMaterias = 47; // Hardcoded por ahora hasta tener la carrera del usuario
  const avancePercent = Math.round((stats.aprobadas / totalMaterias) * 100);

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
            <span>Ingeniería en Sistemas</span>
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