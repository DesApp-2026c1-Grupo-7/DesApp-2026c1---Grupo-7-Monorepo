import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

export default function EditCareer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    creditosNecesarios: 0,
    nivelInglesRequerido: "B1",
    cantidadMaterias: 0
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/carreras/${id}`)
      .then((r) => {
        const c = r.data;
        setForm({
          nombre: c.nombre || "",
          codigo: c.codigo || "",
          descripcion: c.descripcion || "",
          creditosNecesarios: c.creditosNecesarios || 0,
          nivelInglesRequerido: c.nivelInglesRequerido || "B1",
          cantidadMaterias: c.cantidadMaterias || 0
        });
      })
      .catch((e) => setError(e.response?.data?.mensaje || "Error al cargar la carrera"))
      .finally(() => setFetching(false));
  }, [id]);

  const onChange = (k: string, v: string | number) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/carreras/${id}`, {
        ...form,
        creditosNecesarios: Number(form.creditosNecesarios),
        cantidadMaterias: Number(form.cantidadMaterias)
      });
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
      <div className="create-career-container">
        <h1>Editar Carrera</h1>
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
          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={3} value={form.descripcion} onChange={(e) => onChange('descripcion', e.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label>Cantidad de Materias</label>
            <input type="number" value={form.cantidadMaterias} onChange={(e) => onChange('cantidadMaterias', Number(e.target.value))} disabled={loading} />
          </div>
          <div className="form-group">
            <label>Créditos Necesarios</label>
            <input type="number" value={form.creditosNecesarios} onChange={(e) => onChange('creditosNecesarios', Number(e.target.value))} disabled={loading} />
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

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/carreras")} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
