import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

export default function CreateCareerPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [creditosNecesarios, setCreditosNecesarios] = useState<number>(0);
  const [nivelInglesRequerido, setNivelInglesRequerido] = useState("B1");
  const [cantidadMaterias, setCantidadMaterias] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/carreras", {
        nombre, codigo, descripcion,
        creditosNecesarios: Number(creditosNecesarios),
        nivelInglesRequerido,
        cantidadMaterias: Number(cantidadMaterias)
      });
      navigate("/admin/carreras");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al crear la carrera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-career-page">
      <div className="create-career-container">
        <h1>Nueva Carrera</h1>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

          <div className="form-group">
            <label>Nombre de la Carrera</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required disabled={loading} placeholder="Ej: Ingeniería en Sistemas" />
          </div>

          <div className="form-group">
            <label>Código</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required disabled={loading} placeholder="Ej: INGSIST" />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Cantidad de Materias</label>
            <input type="number" min={0} value={cantidadMaterias} onChange={(e) => setCantidadMaterias(Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Créditos Necesarios</label>
            <input type="number" min={0} value={creditosNecesarios} onChange={(e) => setCreditosNecesarios(Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Nivel de Inglés Requerido</label>
            <select value={nivelInglesRequerido} onChange={(e) => setNivelInglesRequerido(e.target.value)} disabled={loading}>
              <option value="Ninguno">Ninguno</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/carreras")} disabled={loading}>
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
