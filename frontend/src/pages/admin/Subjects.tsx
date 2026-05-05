import { useState, useEffect } from "react";
import { getMaterias, deleteMateria, createMateria, type Materia } from "../../services/materias.service";
import { getCarreras, type Carrera } from "../../services/carreras.service";
import "../../styles/Subjects.css";

export default function Subjects() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [search, setSearch] = useState("");
  const [careerFilter, setCareerFilter] = useState("todas");
  const [yearFilter, setYearFilter] = useState("todos");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formCodigo, setFormCodigo] = useState("");
  const [formAnio, setFormAnio] = useState(1);
  const [formCarrera, setFormCarrera] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([getMaterias(), getCarreras()]).then(([m, c]) => {
      setMaterias(m);
      setCarreras(c);
      if (c.length > 0) setFormCarrera(c[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  const filteredSubjects = materias.filter((m) => {
    const matchesSearch = m.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesCareer = careerFilter === "todas" || m.carrera?._id === careerFilter;
    const matchesYear = yearFilter === "todos" || m.anio.toString() === yearFilter;
    return matchesSearch && matchesCareer && matchesYear;
  });

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta materia?")) return;
    await deleteMateria(id);
    setMaterias((prev) => prev.filter((m) => m._id !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formNombre || !formCodigo || !formCarrera) {
      setFormError("Nombre, código y carrera son obligatorios");
      return;
    }
    try {
      const nueva = await createMateria({
        nombre: formNombre,
        codigo: formCodigo,
        anio: formAnio,
        carrera: formCarrera,
      });
      setMaterias((prev) => [...prev, nueva]);
      setShowForm(false);
      setFormNombre("");
      setFormCodigo("");
      setFormAnio(1);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Error al crear la materia");
    }
  }

  return (
    <div className="subjects-container">
      {/* HEADER */}
      <div className="subjects-header">
        <div>
          <h2>Gestión de Materias</h2>
          <p>Administra materias y correlatividades</p>
        </div>

        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Nueva Materia"}
        </button>
      </div>

      {/* FORM NUEVA MATERIA */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {formError && <p style={{ color: "#e74c3c", fontSize: "0.9rem", margin: 0 }}>{formError}</p>}
          <input placeholder="Nombre de la materia" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
          <input placeholder="Código (ej: ALGO101)" value={formCodigo} onChange={(e) => setFormCodigo(e.target.value)} />
          <select value={formAnio} onChange={(e) => setFormAnio(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>{y}° Año</option>)}
          </select>
          <select value={formCarrera} onChange={(e) => setFormCarrera(e.target.value)}>
            {carreras.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
          </select>
          <button type="submit" className="btn-primary">Crear Materia</button>
        </form>
      )}

      {/* FILTROS */}
      <div className="subjects-filters">
        <input
          type="text"
          placeholder="Buscar materia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setCareerFilter(e.target.value)}>
          <option value="todas">Todas las carreras</option>
          {carreras.map((c) => (
            <option key={c._id} value={c._id}>{c.nombre}</option>
          ))}
        </select>

        <select onChange={(e) => setYearFilter(e.target.value)}>
          <option value="todos">Todos los años</option>
          {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y.toString()}>{y}°</option>)}
        </select>
      </div>

      {/* TABLA */}
      <div className="subjects-table">
        <div className="table-header">
          <span>Materia</span>
          <span>Código</span>
          <span>Año</span>
          <span>Carrera</span>
          <span>Correlativas</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>Cargando materias...</p>
        ) : filteredSubjects.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>
            {materias.length === 0 ? "No hay materias creadas aún" : "No se encontraron resultados"}
          </p>
        ) : (
          filteredSubjects.map((m) => (
            <div key={m._id} className="table-row">
              <span>{m.nombre}</span>
              <span>{m.codigo}</span>
              <span>{m.anio}°</span>
              <span className="career">{m.carrera?.nombre || "-"}</span>
              <span>{m.correlativas?.length ? m.correlativas.map((c) => c.nombre).join(", ") : "-"}</span>

              <div className="actions">
                <button title="Eliminar" onClick={() => handleDelete(m._id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
