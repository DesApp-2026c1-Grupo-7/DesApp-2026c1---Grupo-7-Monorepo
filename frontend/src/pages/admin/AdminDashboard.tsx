import "../../styles/AdminDashboard.css";

export default function AdminDashboard() {
  return (
    <div className="admin-container">
      <h1>Panel de Administración</h1>
      <p className="subtitle">Gestiona el sistema académico</p>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <h2>1,247</h2>
          <span>Estudiantes Activos</span>
        </div>

        <div className="stat-card">
          <h2>8</h2>
          <span>Carreras</span>
        </div>

        <div className="stat-card">
          <h2>156</h2>
          <span>Materias</span>
        </div>

        <div className="stat-card warning">
          <h2>5</h2>
          <span>Denuncias Pendientes</span>
        </div>
      </div>

      {/* ACCESOS */}
      <h3>Accesos Rápidos</h3>

      <div className="quick-actions">
        <div className="action">Gestión de Carreras</div>
        <div className="action">Planes de Estudio</div>
        <div className="action">Materias</div>
        <div className="action highlight">Moderación</div>
      </div>

      {/* ACTIVIDAD */}
      <div className="card">
        <h3>Actividad del Sistema</h3>
        <div className="chart-placeholder"></div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="card">
        <h3>Actividad Reciente</h3>

        <div className="activity">
          <p>👤 Nuevo estudiante registrado</p>
          <span>Hace 10 min</span>
        </div>

        <div className="activity">
          <p>📄 Material subido</p>
          <span>Hace 1 hora</span>
        </div>

        <div className="activity">
          <p>⚠️ Nueva denuncia</p>
          <span>Hace 2 horas</span>
        </div>
      </div>
    </div>
  );
}