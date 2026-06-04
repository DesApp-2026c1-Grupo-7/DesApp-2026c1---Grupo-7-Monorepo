import { useNavigate } from "react-router-dom";
import CreateSessionForm from "../../components/CreateSessionForm";
import "../../styles/CreateSession.css";

export default function CreateSession() {
  const navigate = useNavigate();

  return (
    <div className="create-session-page">
      <div className="create-session-container-wide">
        
        {/* Volver */}
        <button
          onClick={() => navigate("/student/sessions")}
          className="btn-back"
        >
          ← Volver a sesiones
        </button>

        <div className="create-session-header-section">
          <h1 className="create-session-main-title">
            Crear Sesión de Estudio
          </h1>
          <p className="create-session-main-subtitle">
            Organiza una sesión y conecta con otros estudiantes para potenciar tu aprendizaje
          </p>
        </div>

        {/* Form */}
        <CreateSessionForm />
      </div>
    </div>
  );
}