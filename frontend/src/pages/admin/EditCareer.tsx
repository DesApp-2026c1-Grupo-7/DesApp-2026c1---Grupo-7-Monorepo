import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

interface StudyPlan {
  _id: string;
  nombre: string;
  anio: number;
  carrera?: { _id: string; nombre: string };
}

export default function EditCareer() {
  const { id } = useParams<{ id: string }>();
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
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cR, pR] = await Promise.all([
          api.get(`/carreras/${id}`),
          api.get("/planes")
        ]);
        
        const c = cR.data;
        setForm({
          nombre: c.nombre || "",
          codigo: c.codigo || "",
          descripcion: c.descripcion || "",
          titulo: c.titulo || "",
          instituto: c.instituto || "",
          duracionAnios: c.duracionAnios || 5
        });

        const allPlans = pR.data as StudyPlan[];
        setPlans(allPlans);
        
        // Buscar si hay algún plan vinculado a esta carrera para mostrarlo por defecto
        const currentPlan = allPlans.find(p => p.carrera?._id === id);
        if (currentPlan) setSelectedPlanId(currentPlan._id);

      } catch (e: any) {
        setError(e.response?.data?.mensaje || "Error al cargar datos");
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const onChange = (key: string, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/carreras/${id}`, {
        ...form,
        duracionAnios: Number(form.duracionAnios)
      });

      // Vincular el plan seleccionado (si cambió)
      if (selectedPlanId) {
        await api.put(`/planes/${selectedPlanId}`, {
          carrera: id
        });
      }

      navigate("/admin/carreras");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al actualizar la carrera");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="create-career-page"><p>Cargando...</p></div>;

  return (
    <div className="create-career-page">
      <div className="create-career-container" style={{ maxWidth: 700 }}>
        <h1>Editar Carrera</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Los requisitos académicos específicos como créditos e inglés se editan desde los Planes de Estudio.
        </p>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: "var(--error)", marginBottom: "1rem" }}>{error}</p>}

          <div className="form-group">
            <label>Nombre de la carrera</label>
            <input value={form.nombre} onChange={(e) => onChange("nombre", e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Código</label>
            <input value={form.codigo} onChange={(e) => onChange("codigo", e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Título que otorga</label>
            <input value={form.titulo} onChange={(e) => onChange("titulo", e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Instituto</label>
            <input value={form.instituto} onChange={(e) => onChange("instituto", e.target.value)} required disabled={loading} />
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
            <label style={{ fontWeight: 700 }}>Plan de Estudio Vinculado</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Selecciona el plan que representa la estructura académica actual de esta carrera.
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
                  {p.nombre} ({p.anio}) {p.carrera?._id === id ? '[Actual]' : p.carrera ? `[De ${p.carrera.nombre}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/carreras")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
