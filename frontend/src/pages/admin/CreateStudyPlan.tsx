import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

interface Career { _id: string; nombre: string; }
interface Subject { _id: string; nombre: string; codigo: string; anio: number; cuatrimestre: number; creditos: number; }

export default function CreateStudyPlan() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    anio: new Date().getFullYear(),
    carrera: "",
    creditosNecesarios: 0,
    creditosOptativasNecesarios: 0,
    nivelInglesRequerido: "B1",
    activo: true
  });
  const [materias, setMaterias] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/carreras"), api.get("/materias")])
      .then(([c, s]) => { setCareers(c.data); setAllSubjects(s.data); });
  }, []);

  const onChange = (k: string, v: string | number | boolean) => setForm((s) => ({ ...s, [k]: v }));
  const toggleMateria = (id: string) => {
    setMaterias((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.carrera) { setError("Debes seleccionar una carrera"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/planes", {
        ...form,
        anio: Number(form.anio),
        creditosNecesarios: Number(form.creditosNecesarios),
        creditosOptativasNecesarios: Number(form.creditosOptativasNecesarios),
        materias
      });
      navigate("/admin/studyplans");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al crear el plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-career-page">
      <div className="create-career-container" style={{ maxWidth: 800 }}>
        <h1>Nuevo Plan de Estudio</h1>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

          <div className="form-group">
            <label>Nombre del Plan</label>
            <input value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} required disabled={loading} placeholder="Ej: Plan 2023" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Año</label>
              <input type="number" min={2000} max={2100} value={form.anio} onChange={(e) => onChange('anio', Number(e.target.value))} disabled={loading} />
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
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.activo} onChange={(e) => onChange('activo', e.target.checked)} />
              Plan Activo (Vigente)
            </label>
          </div>

          <div className="form-group">
            <label>Materias del Plan ({materias.length} seleccionadas)</label>
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              {allSubjects.length === 0 && <p style={{ fontSize: 13, color: '#666' }}>No hay materias para elegir. Crea materias primero.</p>}
              {allSubjects.map((s) => (
                <label key={s._id} style={{ display: 'flex', padding: '4px 6px', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={materias.includes(s._id)}
                    onChange={() => toggleMateria(s._id)}
                  />
                  <span>{s.nombre} <small style={{ color: '#666' }}>({s.codigo}) - {s.anio}° año - {s.creditos} créditos</small></span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/studyplans")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creando..." : "Crear Plan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
