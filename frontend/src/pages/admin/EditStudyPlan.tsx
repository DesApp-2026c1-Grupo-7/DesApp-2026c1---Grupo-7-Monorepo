import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

interface Career { _id: string; nombre: string; }
interface Subject { _id: string; nombre: string; codigo: string; anio: number; cuatrimestre: number; creditos: number; }

export default function EditStudyPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({
    nombre: "", anio: 2023, carrera: "",
    creditosNecesarios: 0, creditosOptativasNecesarios: 0,
    nivelInglesRequerido: "B1", estado: "Vigente"
  });
  const [materias, setMaterias] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cR, sR, pR] = await Promise.all([
          api.get("/carreras"),
          api.get("/materias"),
          api.get(`/planes/${id}`)
        ]);
        setCareers(cR.data);
        setAllSubjects(sR.data);
        const p = pR.data;
        setForm({
          nombre: p.nombre,
          anio: p.anio,
          carrera: p.carrera?._id || p.carrera || "",
          creditosNecesarios: p.creditosNecesarios || 0,
          creditosOptativasNecesarios: p.creditosOptativasNecesarios || 0,
          nivelInglesRequerido: p.nivelInglesRequerido || "B1",
          estado: p.estado || (p.activo === false ? "Discontinuado" : "Vigente")
        });
        setMaterias((p.materias || []).map((m: { _id?: string } | string) =>
          typeof m === "string" ? m : m._id || ""
        ).filter(Boolean));
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { mensaje?: string } } };
        setError(ax.response?.data?.mensaje || "Error al cargar el plan");
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const onChange = (k: string, v: string | number) => setForm((s) => ({ ...s, [k]: v }));
  const toggleMateria = (mid: string) => {
    setMaterias((prev) => prev.includes(mid) ? prev.filter((x) => x !== mid) : [...prev, mid]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/planes/${id}`, {
        ...form,
        anio: Number(form.anio),
        creditosNecesarios: Number(form.creditosNecesarios),
        creditosOptativasNecesarios: Number(form.creditosOptativasNecesarios),
        materias
      });
      navigate("/admin/studyplans");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al actualizar el plan");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="create-career-page"><p>Cargando...</p></div>;

  return (
    <div className="create-career-page">
      <div className="create-career-container" style={{ maxWidth: 800 }}>
        <h1>Editar Plan de Estudio</h1>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

          <div className="form-group">
            <label>Nombre del Plan</label>
            <input value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} required disabled={loading} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Año</label>
              <input type="number" value={form.anio} onChange={(e) => onChange('anio', Number(e.target.value))} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Carrera</label>
              <select value={form.carrera} onChange={(e) => onChange('carrera', e.target.value)} disabled={loading} required>
                <option value="">-- Seleccionar --</option>
                {careers.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Créditos Necesarios</label>
              <input type="number" min={0} value={form.creditosNecesarios} onChange={(e) => onChange('creditosNecesarios', Number(e.target.value))} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Créditos Optativas</label>
              <input type="number" min={0} value={form.creditosOptativasNecesarios} onChange={(e) => onChange('creditosOptativasNecesarios', Number(e.target.value))} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Nivel de Inglés</label>
              <select value={form.nivelInglesRequerido} onChange={(e) => onChange('nivelInglesRequerido', e.target.value)} disabled={loading}>
                <option value="Ninguno">Ninguno</option>
                <option value="A1">A1</option><option value="A2">A2</option>
                <option value="B1">B1</option><option value="B2">B2</option>
                <option value="C1">C1</option><option value="C2">C2</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Estado del plan</label>
            <select value={form.estado} onChange={(e) => onChange('estado', e.target.value)} disabled={loading}>
              <option value="Vigente">Vigente</option>
              <option value="En transicion">En transicion</option>
              <option value="Discontinuado">Discontinuado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Materias del Plan ({materias.length} seleccionadas)</label>
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              {allSubjects.map((s) => (
                <label key={s._id} style={{ display: 'flex', padding: '4px 6px', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={materias.includes(s._id)} onChange={() => toggleMateria(s._id)} />
                  <span>{s.nombre} <small style={{ color: '#666' }}>({s.codigo}) - {s.anio}° año - {s.creditos} créditos</small></span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/studyplans")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
