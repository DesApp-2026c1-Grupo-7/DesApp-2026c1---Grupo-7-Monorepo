import "../../styles/AcademicAssistant.css";

const AcademicAssistant = () => {
  return (
    <div className="assistant">

      <h1>Asistente Académico</h1>
      <p className="subtitle">
        Planifica tu cursada y optimiza tu avance
      </p>

      {/* Materias disponibles */}
      <div className="section">
        <h3>📘 Materias Disponibles para Cursar</h3>

        <div className="subject success">
          <div>
            <strong>Arquitectura de Computadoras</strong>
            <p>Año 2</p>
          </div>
          <span className="badge green">Cumple</span>
        </div>

        <div className="subject success">
          <div>
            <strong>Programación Orientada a Objetos</strong>
            <p>Año 2</p>
          </div>
          <span className="badge green">Cumple</span>
        </div>

        <div className="subject warning">
          <div>
            <strong>Matemática II</strong>
            <p>Año 2</p>
            <small>⚠ Requiere: Matemática I aprobada</small>
          </div>
          <span className="badge orange">No cumple</span>
        </div>
      </div>

      {/* Finales pendientes */}
      <div className="section">
        <h3>📅 Finales Pendientes</h3>

        <div className="final-card">
          <div>
            <strong>Sistemas Operativos</strong>
            <p>Regularizada: 2024-07-15</p>
            <small>Vence en 45 días</small>
          </div>
          <button>Inscribirse</button>
        </div>

        <div className="final-card">
          <div>
            <strong>Base de Datos</strong>
            <p>Regularizada: 2024-07-18</p>
            <small>Vence en 48 días</small>
          </div>
          <button>Inscribirse</button>
        </div>
      </div>

      {/* Proyección */}
      <div className="section">
        <h3>📈 Proyección de Cursada Sugerida</h3>
        <p className="small">
          Basado en tu situación actual y correlatividades
        </p>

        <div className="projection">
          <h4>Cuatrimestre 2024-2</h4>
          <ul>
            <li>Arquitectura de Computadoras</li>
            <li>Programación Orientada a Objetos</li>
          </ul>
        </div>

        <div className="projection">
          <h4>Cuatrimestre 2025-1</h4>
          <ul>
            <li>Matemática II</li>
            <li>Redes de Computadoras</li>
            <li>Ingeniería de Software</li>
          </ul>
        </div>

        <div className="projection">
          <h4>Cuatrimestre 2025-2</h4>
          <ul>
            <li>Sistemas Distribuidos</li>
            <li>Seguridad Informática</li>
          </ul>
        </div>

        <div className="note">
          Nota: Esta es una proyección sugerida. Puedes ajustarla según tu disponibilidad y preferencias.
        </div>
      </div>

    </div>
  );
};

export default AcademicAssistant;