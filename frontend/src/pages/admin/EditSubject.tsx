import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
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
  const { toast, showToast, hideToast } = useToast();

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
        showToast(ax.response?.data?.mensaje || "No se pudo cargar la materia", "error");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, showToast]);

  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/materias/${id}`, {
        ...form,
        carrera: form.carrera || null
      });
      navigate("/admin/subjects", {
        state: { toast: { text: "Materia actualizada con éxito", type: "success" } }
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo actualizar la materia", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="create-career-page"><p>Cargando...</p></div>;

  return (
    <div className="create-career-page">
      <Toast toast={toast} onClose={hideToast} />
      <div className="create-career-container" style={{ maxWidth: 600 }}>
        <h1>Editar Materia</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Edita los datos básicos. Los requisitos específicos y correlatividades se administran en los Planes de Estudio que utilicen esta materia.
        </p>
        <form className="create-career-form" onSubmit={handleSubmit}>

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
