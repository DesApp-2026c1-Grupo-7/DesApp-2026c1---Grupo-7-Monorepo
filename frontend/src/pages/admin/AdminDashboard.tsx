import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCarreras } from "../../services/carreras.service";
import { getMaterias } from "../../services/materias.service";
import "../../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ carreras: 0, materias: 0 });

  useEffect(() => {
    Promise.all([getCarreras(), getMaterias()]).then(([carreras, materias]) => {
      setStats({ carreras: carreras.length, materias: materias.length });
    });
  }, []);

  return (
    <div className="admin-container">
      <h1>Panel de Administración</h1>
      <p className="subtitle">Gestiona el sistema académico</p>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <h2>{stats.carreras}</h2>
          <span>Carreras</span>
        </div>

        <div className="stat-card">
          <h2>{stats.materias}</h2>
          <span>Materias</span>
        </div>
      </div>

      {/* ACCESOS */}
      <h3>Accesos Rápidos</h3>

      <div className="quick-actions">
        <div className="action" onClick={() => navigate("/admin/carreras")} style={{ cursor: "pointer" }}>
          Gestión de Carreras
        </div>
        <div className="action" onClick={() => navigate("/admin/studyplans")} style={{ cursor: "pointer" }}>
          Planes de Estudio
        </div>
        <div className="action" onClick={() => navigate("/admin/subjects")} style={{ cursor: "pointer" }}>
          Materias
        </div>
        <div className="action highlight" onClick={() => navigate("/admin/moderation")} style={{ cursor: "pointer" }}>
          Moderación
        </div>
      </div>
    </div>
  );
}
