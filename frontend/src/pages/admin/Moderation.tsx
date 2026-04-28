import "../../styles/Moderation.css";
import { Flag, CheckCircle, XCircle, Eye } from "lucide-react";

const reports = [
  {
    id: 1,
    tipo: "Material",
    estado: "Pendiente",
    titulo: "Resumen de Algoritmos - Archivo con contenido no relacionado",
    motivo: "Contenido inapropiado",
    reportante: "Juan Pérez",
    reportado: "Usuario Anónimo",
    fecha: "14/5/2024",
  },
  {
    id: 2,
    tipo: "Comentario",
    estado: "Pendiente",
    titulo: "Comentario ofensivo en sesión de estudio",
    motivo: "Lenguaje ofensivo",
    reportante: "María González",
    reportado: "Carlos López",
    fecha: "13/5/2024",
  },
];

export default function Moderation() {
  return (
    <div className="moderation-container">
      <h1>Panel de Moderación</h1>
      <p className="subtitle">
        Gestiona denuncias y contenido reportado
      </p>

      {/* RESUMEN */}
      <div className="stats">
        <div className="stat-card warning">
          <Flag />
          <div>
            <h2>2</h2>
            <p>Denuncias Pendientes</p>
          </div>
        </div>

        <div className="stat-card success">
          <CheckCircle />
          <div>
            <h2>1</h2>
            <p>Resueltas</p>
          </div>
        </div>

        <div className="stat-card neutral">
          <XCircle />
          <div>
            <h2>1</h2>
            <p>Rechazadas</p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="filters">
        <select>
          <option>Todos los estados</option>
        </select>
        <select>
          <option>Todos los tipos</option>
        </select>
        <select>
          <option>Más recientes</option>
        </select>
      </div>

      {/* LISTA */}
      <div className="reports">
        {reports.map((r) => (
          <div key={r.id} className="report-card">
            <div className="report-header">
              <div className="tags">
                <span className="tag tipo">{r.tipo}</span>
                <span className="tag estado">{r.estado}</span>
              </div>
              <span className="fecha">{r.fecha}</span>
            </div>

            <h3>{r.titulo}</h3>
            <p className="motivo">Motivo: {r.motivo}</p>

            <div className="report-info">
              <div>
                <small>Reportado por</small>
                <p>{r.reportante}</p>
              </div>
              <div>
                <small>Usuario reportado</small>
                <p>{r.reportado}</p>
              </div>
            </div>

            <div className="actions">
              <button className="btn-outline">
                <Eye size={16} /> Ver Detalles
              </button>

              <div className="right-actions">
                <button className="btn-danger">
                  <XCircle size={16} /> Eliminar Contenido
                </button>
                <button className="btn-success">
                  <CheckCircle size={16} /> Aprobar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}