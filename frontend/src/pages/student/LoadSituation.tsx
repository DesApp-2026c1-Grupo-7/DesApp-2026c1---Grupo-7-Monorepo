import { useNavigate } from "react-router-dom";
import "../../styles/LoadSituation.css";

const LoadSituation = () => {
  const navigate = useNavigate();

  return (
    <div className="load-situation">

      <span className="back" onClick={() => navigate("/student/situation")}>
        ← Volver al historial
      </span>

      <h1>Cargar Situación Académica</h1>
      <p className="subtitle">
        Elige cómo deseas cargar tu historial académico
      </p>

      <div className="options">

        <div className="option-card">
          <div className="icon blue">✏️</div>
          <h3>Carga Manual</h3>
          <p>Ingresa tus materias una por una mediante un formulario</p>

          <ul>
            <li>✔ Control total de los datos</li>
            <li>✔ Ideal para pocas materias</li>
            <li>✔ Validación en tiempo real</li>
          </ul>
        </div>

        <div className="option-card">
          <div className="icon green">⬆️</div>
          <h3>Subir Excel</h3>
          <p>Importa tu historial desde un archivo Excel o CSV</p>

          <ul>
            <li>✔ Carga masiva de datos</li>
            <li>✔ Rápido y eficiente</li>
            <li>✔ Detección de errores</li>
          </ul>
        </div>

      </div>

      <div className="template-box">
        <h4>Plantilla de Excel</h4>
        <p>
          Para facilitar la carga, descarga nuestra plantilla de Excel con el formato correcto.
        </p>

        <button className="btn-primary">
          Descargar Plantilla
        </button>
      </div>

    </div>
  );
};

export default LoadSituation;