import { useNavigate } from "react-router-dom";
import "../../styles/CreateCareer.css";

export default function CreateCareerPage() {
  const navigate = useNavigate();

  return (
    <div className="create-career-page">
      <div className="create-career-container">

        <h1>Nueva Carrera</h1>

        <form className="create-career-form">

          <div className="form-group">
            <label>Nombre de la Carrera</label>
            <input
              type="text"
              placeholder="Ej: Ingeniería en Sistemas"
            />
          </div>

          <div className="form-group">
            <label>Código</label>
            <input
              type="text"
              placeholder="Ej: INGSIST"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              placeholder="Descripción de la carrera..."
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/admin/carreras")}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-primary">
              Crear
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}