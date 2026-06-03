import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

interface Career { _id: string; nombre: string; }

export default function EditSubject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);

  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    carrera: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cR, mR] = await Promise.all([
          api.get("/carreras"),
          api.get(`/materias/${id}`)
        ]);
        setCareers(cR.data);
        const m = mR.data;
        setForm({
          nombre: m.nombre,
          codigo: m.codigo,
          carrera: m.carrera?._id || m.carrera || ""
        });
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { mensaje?: string } } };
        setError(ax.response?.data?.mensaje || "Error al cargar la materia");
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/materias/${id}`, {
        ...form,
        carrera: form.carrera || null
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
      <div className="create-career-container" style={{ maxWidth: 600 }}>
        <h1>Editar Materia</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Edita los datos básicos. Los requisitos específicos y correlatividades se administran en los Planes de Estudio que utilicen esta materia.
        </p>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

          <div className="form-group">
            <label>Nombre de la Materia</label>
            <input value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Código Único</label>
            <input value={form.codigo} onChange={(e) => onChange('codigo', e.target.value)} required disabled={loading} />
          </div>

          <div className="form-group">
            <label>Carrera Base</label>
            <select value={form.carrera} onChange={(e) => onChange('carrera', e.target.value)} disabled={loading}>
              <option value="">-- Sin asignar --</option>
              {careers.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/subjects")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
