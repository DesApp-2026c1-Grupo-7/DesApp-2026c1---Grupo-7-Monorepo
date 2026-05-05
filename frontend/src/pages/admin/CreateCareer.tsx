import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCarrera } from "../../services/carreras.service";
import "../../styles/CreateCareer.css";

export default function CreateCareerPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre || !codigo) {
      setError("Nombre y código son obligatorios");
      return;
    }

    setLoading(true);
    try {
      await createCarrera({ nombre, codigo, descripcion });
      navigate("/admin/carreras");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al crear la carrera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-career-page">
      <div className="create-career-container">
        <h1>Nueva Carrera</h1>

        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: "#e74c3c", fontSize: "0.9rem" }}>{error}</p>}

          <div className="form-group">
            <label>Nombre de la Carrera</label>
            <input
              type="text"
              placeholder="Ej: Ingeniería en Sistemas"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Código</label>
            <input
              type="text"
              placeholder="Ej: INGSIST"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              placeholder="Descripción de la carrera..."
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
