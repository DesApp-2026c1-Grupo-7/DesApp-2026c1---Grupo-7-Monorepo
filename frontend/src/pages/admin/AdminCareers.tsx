import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/AdminCareers.css";

interface Career {
  _id: string;
  nombre: string;
  codigo: string;
  cantidadEstudiantes: number;
  cantidadMaterias: number;
  materiasUnahurRequeridas?: number;
  creditosNecesarios?: number;
  nivelInglesRequerido?: string;
}

export default function AdminCareers() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchCareers = useCallback(async () => {
    try {
      const r = await api.get("/carreras");
      setCareers(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCareers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCareers]);

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la carrera "${nombre}"?`)) return;
    try {
      await api.delete(`/carreras/${id}`);
      await fetchCareers();
      setError("");
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al eliminar la carrera");
    }
  };

  const filtered = careers.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-careers-container">
      <div className="admin-careers-header">
        <div>
          <h1>Gestión de Carreras</h1>
          <p>Administra las carreras disponibles</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/admin/carreras/nueva")}>
          + Nueva Carrera
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee', color: '#c33', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="admin-search-box">
        <input
          placeholder="Buscar carrera..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-container">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Cargando carreras...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Código</th>
                <th>Estudiantes</th>
                <th>Materias</th>
                <th>UNAHUR</th>
                <th>Créditos</th>
                <th>Inglés</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>{c.nombre}</td>
                  <td className="code">{c.codigo}</td>
                  <td>{c.cantidadEstudiantes}</td>
                  <td>{c.cantidadMaterias}</td>
                  <td>{c.materiasUnahurRequeridas || 0}</td>
                  <td>{c.creditosNecesarios || 0}</td>
                  <td>{c.nivelInglesRequerido || '-'}</td>
                  <td className="actions">
                    <button
                      className="icon-btn edit"
                      title="Editar"
                      onClick={() => navigate(`/admin/carreras/editar/${c._id}`)}
                    >✏️</button>
                    <button
                      className="icon-btn delete"
                      title="Eliminar"
                      onClick={() => handleDelete(c._id, c.nombre)}
                    >🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No se encontraron carreras.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
