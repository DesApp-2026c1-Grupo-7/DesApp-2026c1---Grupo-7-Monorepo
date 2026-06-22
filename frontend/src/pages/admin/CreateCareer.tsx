import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import "../../styles/CreateCareer.css";

export default function CreateCareerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    titulo: "",
    instituto: "",
    duracionAnios: 5
  });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const onChange = (key: string, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/carreras", {
        ...form,
        duracionAnios: Number(form.duracionAnios)
      });

      navigate("/admin/carreras", {
        state: { toast: { text: "Carrera creada con éxito", type: "success" } }
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo crear la carrera", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-career-page">
      <Toast toast={toast} onClose={hideToast} />
      <div className="create-career-container" style={{ maxWidth: 700 }}>
        <h1>Nueva Carrera</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Define los datos básicos de la carrera. Los requisitos académicos se gestionan desde sus Planes de Estudio.
        </p>
        <form className="create-career-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Nombre de la carrera</label>
            <input value={form.nombre} onChange={(e) => onChange("nombre", e.target.value)} required disabled={loading} placeholder="Ej: Licenciatura en Informática" />
          </div>

          <div className="form-group">
            <label>Código</label>
            <input value={form.codigo} onChange={(e) => onChange("codigo", e.target.value)} required disabled={loading} placeholder="Ej: LI" />
          </div>

          <div className="form-group">
            <label>Título que otorga</label>
            <input value={form.titulo} onChange={(e) => onChange("titulo", e.target.value)} required disabled={loading} placeholder="Ej: Licenciado/a en Informática" />
          </div>

          <div className="form-group">
            <label>Instituto</label>
            <input value={form.instituto} onChange={(e) => onChange("instituto", e.target.value)} required disabled={loading} placeholder="Ej: Instituto de Tecnología" />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={3} value={form.descripcion} onChange={(e) => onChange("descripcion", e.target.value)} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Duración estimada (años)</label>
            <input type="number" min={1} value={form.duracionAnios} onChange={(e) => onChange("duracionAnios", Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/carreras")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creando..." : "Crear Carrera"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
