import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

interface StudyPlan {
  _id: string;
  nombre: string;
  anio: number;
  carrera?: { nombre: string };
  materias: Array<{ _id: string; nombre: string; codigo: string }>;
}

export default function CreateCareerPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    titulo: "",
    instituto: "",
    duracionAnios: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/planes").then((r) => setPlans(r.data)).catch(console.error);
  }, []);

  const onChange = (key: string, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Nota: El plan seleccionado es informativo para esta vista, 
      // ya que la relación se guarda en el Plan (apuntando a la Carrera).
      const res = await api.post("/carreras", {
        ...form,
        duracionAnios: Number(form.duracionAnios)
      });
      
      const newCareerId = res.data.career._id;
      
      // Si se seleccionó un plan, lo vinculamos a la nueva carrera
      if (selectedPlanId) {
        await api.put(`/planes/${selectedPlanId}`, {
          carrera: newCareerId
        });
      }

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
      <div className="create-career-container" style={{ maxWidth: 700 }}>
        <h1>Nueva Carrera</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Define los datos básicos de la carrera. Los requisitos académicos se gestionan desde sus Planes de Estudio.
        </p>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: "var(--error)", marginBottom: "1rem" }}>{error}</p>}

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

          <div className="form-group" style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-soft)', borderRadius: '12px', border: '1px dashed var(--border-strong)' }}>
            <label style={{ fontWeight: 700 }}>Vincular Plan de Estudio (Opcional)</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Puedes seleccionar un plan existente para asignarlo a esta carrera inmediatamente.
            </p>
            <select 
              value={selectedPlanId} 
              onChange={(e) => setSelectedPlanId(e.target.value)} 
              disabled={loading}
              style={{ background: 'var(--bg-card-solid)' }}
            >
              <option value="">-- Sin plan asignado --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nombre} ({p.anio}) {p.carrera ? `[Ya vinculado a ${p.carrera.nombre}]` : ''}
                </option>
              ))}
            </select>
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
