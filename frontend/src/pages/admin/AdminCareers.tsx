import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import "../../styles/AdminCareers.css";

interface Career {
  _id: string;
  nombre: string;
  codigo: string;
  cantidadEstudiantes: number;
  cantidadMaterias: number;
  titulo: string;
  instituto: string;
}

export default function AdminCareers() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast, showToast, hideToast } = useToast();

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
      showToast("Carrera eliminada correctamente", "success");
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo eliminar la carrera", "error");
    }
  };

  const filtered = careers.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-careers-container">
      <Toast toast={toast} onClose={hideToast} />
      <div className="admin-careers-header">
        <div>
          <h1>Gestión de Carreras</h1>
          <p>Administra las carreras base del sistema</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/admin/carreras/nueva")}>
          + Nueva Carrera
        </button>
      </div>

      <div className="admin-search-box">
        <input
          placeholder="Buscar carrera por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-container desktop-only">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Cargando carreras...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Código</th>
                <th>Título</th>
                <th>Instituto</th>
                <th style={{ textAlign: 'center' }}>Alumnos</th>
                <th style={{ textAlign: 'center' }}>Materias</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td className="code">{c.codigo}</td>
                  <td>{c.titulo}</td>
                  <td>{c.instituto}</td>
                  <td style={{ textAlign: 'center' }}>{c.cantidadEstudiantes}</td>
                  <td style={{ textAlign: 'center' }}>{c.cantidadMaterias}</td>
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

      {/* MOBILE CARDS */}
      <div className="mobile-only-cards">
        {loading ? (
          <p>Cargando...</p>
        ) : filtered.length > 0 ? (
          filtered.map((c) => (
            <div key={c._id} className="career-mobile-card">
              <div className="card-row header">
                <span className="name">{c.nombre}</span>
                <span className="code">{c.codigo}</span>
              </div>
              <div className="card-stats-grid">
                <div><label>Título</label><span>{c.titulo}</span></div>
                <div><label>Instituto</label><span>{c.instituto}</span></div>
                <div><label>Alumnos</label><span>{c.cantidadEstudiantes}</span></div>
                <div><label>Materias</label><span>{c.cantidadMaterias}</span></div>
              </div>
              <div className="card-actions">
                <button className="btn secondary" onClick={() => navigate(`/admin/carreras/editar/${c._id}`)}>Editar</button>
                <button className="btn secondary" style={{ color: 'var(--error)' }} onClick={() => handleDelete(c._id, c.nombre)}>Eliminar</button>
              </div>
            </div>
          ))
        ) : (
          <p>No se encontraron carreras.</p>
        )}
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '12px', fontSize: '0.9rem' }}>
        <strong>💡 Nota:</strong> Los requisitos académicos (Créditos, UNAHUR e Inglés) ahora se configuran directamente en los <strong>Planes de Estudio</strong> de cada carrera.
      </div>
    </div>
  );
}
