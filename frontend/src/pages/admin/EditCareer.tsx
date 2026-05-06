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
    titulo: "",
    instituto: "",
    duracionAnios: 5,
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
          titulo: c.titulo || "",
          instituto: c.instituto || "",
          duracionAnios: c.duracionAnios || 5,
          creditosNecesarios: c.creditosNecesarios || 0,
          nivelInglesRequerido: c.nivelInglesRequerido || "B1",
          cantidadMaterias: c.cantidadMaterias || 0
        });
      })
      .catch((e) => setError(e.response?.data?.mensaje || "Error al cargar la carrera"))
      .finally(() => setFetching(false));
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
        duracionAnios: Number(form.duracionAnios),
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
          {error && <p style={{ color: "var(--error)", marginBottom: "1rem" }}>{error}</p>}

          {[
            ["nombre", "Nombre"],
            ["codigo", "Codigo"],
            ["titulo", "Titulo que otorga"],
            ["instituto", "Instituto"]
          ].map(([key, label]) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input value={String(form[key as keyof typeof form])} onChange={(e) => onChange(key, e.target.value)} required disabled={loading} />
            </div>
          ))}

          <div className="form-group">
            <label>Descripcion</label>
            <textarea rows={3} value={form.descripcion} onChange={(e) => onChange("descripcion", e.target.value)} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Duracion estimada (anios)</label>
            <input type="number" min={1} value={form.duracionAnios} onChange={(e) => onChange("duracionAnios", Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Cantidad de materias</label>
            <input type="number" min={0} value={form.cantidadMaterias} onChange={(e) => onChange("cantidadMaterias", Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Creditos necesarios</label>
            <input type="number" min={0} value={form.creditosNecesarios} onChange={(e) => onChange("creditosNecesarios", Number(e.target.value))} disabled={loading} />
          </div>

          <div className="form-group">
            <label>Nivel de ingles</label>
            <select value={form.nivelInglesRequerido} onChange={(e) => onChange("nivelInglesRequerido", e.target.value)} disabled={loading}>
              {["Ninguno", "A1", "A2", "B1", "B2", "C1", "C2"].map((nivel) => (
                <option key={nivel} value={nivel}>{nivel}</option>
              ))}
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
