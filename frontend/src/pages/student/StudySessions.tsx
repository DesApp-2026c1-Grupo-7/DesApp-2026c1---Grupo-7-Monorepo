import "../../styles/StudySessions.css";
import { useNavigate } from "react-router-dom";

const sessions = [
  {
    id: 1,
    materia: "Base de Datos",
    organizador: "Ana López",
    fecha: "17/5/2024",
    hora: "16:00hs",
    lugar: "Biblioteca - Sala 3",
    participantes: "8/12",
    modalidad: "Presencial",
  },
  {
    id: 2,
    materia: "Redes de Computadoras",
    organizador: "Carlos Ruiz",
    fecha: "19/5/2024",
    hora: "18:00hs",
    lugar: "Google Meet",
    participantes: "5/10",
    modalidad: "Virtual",
  },
  {
    id: 3,
    materia: "Algoritmos y Estructuras",
    organizador: "María González",
    fecha: "21/5/2024",
    hora: "14:00hs",
    lugar: "Aula 205",
    participantes: "12/15",
    modalidad: "Presencial",
  },
];

const StudySessions = () => {
  const navigate = useNavigate();    
  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <div>
          <h2>Sesiones de Estudio</h2>
          <p>Encuentra o crea grupos de estudio</p>
        </div>

        <button 
        onClick={() => navigate("/student/create-session")}
        className="btn-primary">+ Crear Sesión</button>
      </div>

      {/* FILTROS */}
      <div className="sessions-filters">
        <input placeholder="Buscar materia..." />

        <select>
          <option>Todas las modalidades</option>
          <option>Presencial</option>
          <option>Virtual</option>
        </select>

        <select>
          <option>Todas las fechas</option>
        </select>

        <select>
          <option>Con cupos disponibles</option>
        </select>
      </div>

      {/* LISTADO */}
      <div className="sessions-list">
        {sessions.map((s) => (
          <div key={s.id} className="session-card">
            <div className="session-top">
              <div>
                <h3>{s.materia}</h3>
                <p>Organizada por {s.organizador}</p>
              </div>

              <span
                className={`badge ${
                  s.modalidad === "Presencial"
                    ? "badge-blue"
                    : "badge-purple"
                }`}
              >
                {s.modalidad}
              </span>
            </div>

            <div className="session-info">
              <span>📅 {s.fecha}</span>
              <span>⏰ {s.hora}</span>
              <span>📍 {s.lugar}</span>
              <span>👥 {s.participantes} participantes</span>
            </div>

            <div className="session-footer">
              <div className="progress-bar">
                <div className="progress" />
              </div>

              <button className="btn-primary">Unirse</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudySessions;