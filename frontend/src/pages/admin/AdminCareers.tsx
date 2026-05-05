import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCarreras, deleteCarrera, type Carrera } from "../../services/carreras.service";
import "../../styles/AdminCareers.css";

export default function AdminCareers() {
  const navigate = useNavigate();
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarreras();
  }, []);

  async function loadCarreras() {
    try {
      const data = await getCarreras();
      setCarreras(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta carrera?")) return;
    await deleteCarrera(id);
    setCarreras((prev) => prev.filter((c) => c._id !== id));
  }

  const filtered = carreras.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-careers-container">
      {/* Header */}
      <div className="admin-careers-header">
        <div>
          <h1>Gestión de Carreras</h1>
          <p>Administra las carreras disponibles</p>
        </div>

        <button className="btn-primary" onClick={() => navigate("/admin/carreras/nueva")}>
          + Nueva Carrera
        </button>
      </div>

      {/* Buscador */}
      <div className="admin-search-box">
        <input
          placeholder="Buscar carrera..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="admin-table-container">
        {loading ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>Cargando carreras...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>
            {carreras.length === 0 ? "No hay carreras creadas aún" : "No se encontraron resultados"}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Código</th>
                <th>Materias</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>{c.nombre}</td>
                  <td className="code">{c.codigo}</td>
                  <td>{c.materias}</td>
                  <td className="actions">
                    <button className="icon-btn delete" onClick={() => handleDelete(c._id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
