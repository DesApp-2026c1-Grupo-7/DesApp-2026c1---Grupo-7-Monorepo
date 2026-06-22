import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import "../../styles/CreateCareer.css";

export default function EditCareer() {
  const { id } = useParams<{ id: string }>();
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
  const [fetching, setFetching] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/carreras/${id}`);

        const c = res.data;
        setForm({
          nombre: c.nombre || "",
          codigo: c.codigo || "",
          descripcion: c.descripcion || "",
          titulo: c.titulo || "",
          instituto: c.instituto || "",
          duracionAnios: c.duracionAnios || 5
        });

      } catch (e: unknown) {
        const ax = e as { response?: { data?: { mensaje?: string } } };
        showToast(ax.response?.data?.mensaje || "No se pudieron cargar los datos", "error");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, showToast]);

  const onChange = (key: string, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/carreras/${id}`, {
        ...form,
        duracionAnios: Number(form.duracionAnios)
      });

      navigate("/admin/carreras", {
        state: { toast: { text: "Carrera actualizada con éxito", type: "success" } }
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo actualizar la carrera", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="create-career-page"><p>Cargando...</p></div>;

  return (
    <div className="create-career-page">
      <Toast toast={toast} onClose={hideToast} />
      <div className="create-career-container" style={{ maxWidth: 700 }}>
        <h1>Editar Carrera</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Los requisitos académicos específicos como créditos e inglés se editan desde los Planes de Estudio.
        </p>
        <form className="create-career-form" onSubmit={handleSubmit}>

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

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/carreras")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
