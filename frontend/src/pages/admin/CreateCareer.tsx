import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

export default function CreateCareerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    titulo: "",
    instituto: "",
    duracionAnios: 5,
    creditosNecesarios: 0,
    nivelInglesRequerido: "B1",
    cantidadMaterias: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (key: string, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/carreras", {
        ...form,
        duracionAnios: Number(form.duracionAnios),
        creditosNecesarios: Number(form.creditosNecesarios),
        cantidadMaterias: Number(form.cantidadMaterias)
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
          {error && <p style={{ color: "var(--error)", marginBottom: "1rem" }}>{error}</p>}

          <div className="form-group">
            <label>Nombre de la carrera</label>
            <input value={form.nombre} onChange={(e) => onChange("nombre", e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Codigo</label>
            <input value={form.codigo} onChange={(e) => onChange("codigo", e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Titulo que otorga</label>
            <input value={form.titulo} onChange={(e) => onChange("titulo", e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Instituto</label>
            <input value={form.instituto} onChange={(e) => onChange("instituto", e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Descripcion</label>
            <textarea rows={3} value={form.descripcion} onChange={(e) => onChange("descripcion", e.target.value)} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Duracion estimada (anios)</label>
            <input type="number" min={1} value={form.duracionAnios} onChange={(e) => onChange("duracionAnios", Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Cantidad de materias</label>
            <input type="number" min={0} value={form.cantidadMaterias} onChange={(e) => onChange("cantidadMaterias", Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Creditos necesarios</label>
            <input type="number" min={0} value={form.creditosNecesarios} onChange={(e) => onChange("creditosNecesarios", Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Nivel de ingles requerido</label>
            <select value={form.nivelInglesRequerido} onChange={(e) => onChange("nivelInglesRequerido", e.target.value)} disabled={loading}>
              {["Ninguno", "A1", "A2", "B1", "B2", "C1", "C2"].map((nivel) => (
                <option key={nivel} value={nivel}>{nivel}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/carreras")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creando..." : "Crear"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
