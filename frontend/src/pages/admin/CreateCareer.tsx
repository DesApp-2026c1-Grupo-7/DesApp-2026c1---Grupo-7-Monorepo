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
  creditosNecesarios: number;
  materiasUnahurRequeridas: number;
  nivelInglesRequerido: string;
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
    if (!selectedPlanId) {
      setError("Debes seleccionar un plan de estudio base");
      return;
    }

    const plan = plans.find(p => p._id === selectedPlanId);
    if (!plan) return;

    setLoading(true);
    setError("");
    try {
      await api.post("/carreras", {
        ...form,
        duracionAnios: Number(form.duracionAnios),
        cantidadMaterias: plan.materias.length,
        materiasUnahurRequeridas: plan.materiasUnahurRequeridas,
        creditosNecesarios: plan.creditosNecesarios,
        nivelInglesRequerido: plan.nivelInglesRequerido
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
            <label>Seleccionar Plan de Estudio Base</label>
            <select 
              value={selectedPlanId} 
              onChange={(e) => setSelectedPlanId(e.target.value)} 
              required 
              disabled={loading}
            >
              <option value="">-- Seleccionar Plan --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.carrera?.nombre || 'Plan'} - {p.nombre} ({p.anio})
                </option>
              ))}
            </select>
            {selectedPlanId && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px' }}>
                <p>Materias: {plans.find(p => p._id === selectedPlanId)?.materias.length}</p>
                <p>UNAHUR: {plans.find(p => p._id === selectedPlanId)?.materiasUnahurRequeridas}</p>
                <p>Créditos: {plans.find(p => p._id === selectedPlanId)?.creditosNecesarios}</p>
                <p>Inglés: {plans.find(p => p._id === selectedPlanId)?.nivelInglesRequerido}</p>
              </div>
            )}
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
