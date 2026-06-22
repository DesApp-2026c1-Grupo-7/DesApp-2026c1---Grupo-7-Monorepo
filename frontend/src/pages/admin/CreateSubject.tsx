import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import "../../styles/CreateCareer.css";

interface Career { _id: string; nombre: string; }

export default function CreateSubject() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);

  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    carrera: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    api.get("/carreras")
      .then((c) => { setCareers(c.data); })
      .catch(() => {});
  }, []);

  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/materias", {
        ...form,
        carrera: form.carrera || null
      });
      navigate("/admin/subjects", {
        state: { toast: { text: "Materia creada con éxito", type: "success" } }
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo crear la materia", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-career-page">
      <Toast toast={toast} onClose={hideToast} />
      <div className="create-career-container" style={{ maxWidth: 600 }}>
        <h1>Nueva Materia</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Define los datos básicos de la materia. Los requisitos, año, cuatrimestre y correlatividades se configuran desde los Planes de Estudio.
        </p>
        <form className="create-career-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Nombre de la Materia</label>
            <input 
              value={form.nombre} 
              onChange={(e) => onChange('nombre', e.target.value)} 
              required 
              disabled={loading} 
              placeholder="Ej: Análisis Matemático I"
            />
          </div>

          <div className="form-group">
            <label>Código Único</label>
            <input 
              value={form.codigo} 
              onChange={(e) => onChange('codigo', e.target.value)} 
              required 
              disabled={loading} 
              placeholder="Ej: AMI" 
            />
          </div>

          <div className="form-group">
            <label>Carrera Base (Opcional)</label>
            <select value={form.carrera} onChange={(e) => onChange('carrera', e.target.value)} disabled={loading}>
              <option value="">-- Sin asignar --</option>
              {careers.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/subjects")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creando..." : "Crear Materia"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
