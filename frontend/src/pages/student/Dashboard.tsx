import "../../styles/Dashboard.css";
import StatCard from "../../components/StatCard";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bienvenido, Juan Pérez</p>
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
            <div className="progress-fill" style={{ width: "68%" }} />
          </div>
          <span className="progress-percent">68%</span>
        </div>

        <p className="progress-text">
          32 de 47 materias aprobadas
        </p>
      </div>

      {/* STATS */}

      <div className="stats">
        
        <StatCard title="Materias Aprobadas" value="32" color="green"/> 
        <StatCard title="Regularizadas" value="8" color="blue" />
        <StatCard title="Pendientes" value="7" color="orange" />
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