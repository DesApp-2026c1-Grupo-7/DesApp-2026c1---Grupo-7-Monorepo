import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

interface Career { _id: string; nombre: string; }
interface Subject { _id: string; nombre: string; codigo: string; }

export default function EditSubject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  const [form, setForm] = useState({
    nombre: "", codigo: "", anio: 1, cuatrimestre: 1, creditos: 0,
    carrera: "", esOptativa: false, esUnahur: true
  });
  const [correlativas, setCorrelativas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cR, sR, mR] = await Promise.all([
          api.get("/carreras"),
          api.get("/materias"),
          api.get(`/materias/${id}`)
        ]);
        setCareers(cR.data);
        setAllSubjects(sR.data.filter((s: Subject) => s._id !== id));
        const m = mR.data;
        setForm({
          nombre: m.nombre,
          codigo: m.codigo,
          anio: m.anio,
          cuatrimestre: m.cuatrimestre,
          creditos: m.creditos || 0,
          carrera: m.carrera?._id || m.carrera || "",
          esOptativa: !!m.esOptativa,
          esUnahur: m.esUnahur !== false
        });
        setCorrelativas((m.correlativas || []).map((c: { _id?: string } | string) =>
          typeof c === "string" ? c : c._id || ""
        ).filter(Boolean));
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { mensaje?: string } } };
        setError(ax.response?.data?.mensaje || "Error al cargar la materia");
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const onChange = (k: string, v: string | number | boolean) => setForm((s) => ({ ...s, [k]: v }));
  const toggleCorrelativa = (cid: string) => {
    setCorrelativas((prev) => prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/materias/${id}`, {
        ...form,
        anio: Number(form.anio),
        cuatrimestre: Number(form.cuatrimestre),
        creditos: Number(form.creditos),
        carrera: form.carrera || null,
        correlativas
      });
      navigate("/admin/subjects");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al actualizar la materia");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="create-career-page"><p>Cargando...</p></div>;

  return (
    <div className="create-career-page">
      <div className="create-career-container" style={{ maxWidth: 720 }}>
        <h1>Editar Materia</h1>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

          <div className="form-group">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} required disabled={loading} />
          </div>
          <div className="form-group">
            <label>Código</label>
            <input value={form.codigo} onChange={(e) => onChange('codigo', e.target.value)} required disabled={loading} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Año</label>
              <select value={form.anio} onChange={(e) => onChange('anio', Number(e.target.value))} disabled={loading}>
                {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}°</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cuatrimestre</label>
              <select value={form.cuatrimestre} onChange={(e) => onChange('cuatrimestre', Number(e.target.value))} disabled={loading}>
                <option value={1}>1° Cuatrimestre</option>
                <option value={2}>2° Cuatrimestre</option>
                <option value={0}>Anual</option>
              </select>
            </div>
            <div className="form-group">
              <label>Créditos</label>
              <input type="number" min={0} value={form.creditos} onChange={(e) => onChange('creditos', Number(e.target.value))} disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label>Carrera</label>
            <select value={form.carrera} onChange={(e) => onChange('carrera', e.target.value)} disabled={loading}>
              <option value="">-- Sin asignar --</option>
              {careers.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.esOptativa} onChange={(e) => onChange('esOptativa', e.target.checked)} />
              Es optativa
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.esUnahur} onChange={(e) => onChange('esUnahur', e.target.checked)} />
              Es UNAHUR
            </label>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Correlativas</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              {allSubjects.map((s) => (
                <label key={s._id} style={{ display: 'block', padding: '4px 6px' }}>
                  <input
                    type="checkbox"
                    checked={correlativas.includes(s._id)}
                    onChange={() => toggleCorrelativa(s._id)}
                  />{" "}
                  {s.nombre} <small style={{ color: '#666' }}>({s.codigo})</small>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/subjects")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
