import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Subjects.css";

interface Career {
  _id: string;
  nombre: string;
  codigo: string;
}

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
  carrera?: Career;
}

export default function Subjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [careerFilter, setCareerFilter] = useState("todas");
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [subRes, carRes] = await Promise.all([
        api.get("/materias"),
        api.get("/carreras")
      ]);
      setSubjects(subRes.data);
      setCareers(carRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAll]);

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la materia "${nombre}"?`)) return;
    try {
      await api.delete(`/materias/${id}`);
      await fetchAll();
      setError("");
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al eliminar materia");
    }
  };

  const filtered = subjects.filter((s) => {
    const matchSearch = s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.codigo.toLowerCase().includes(search.toLowerCase());
    const matchCareer = careerFilter === "todas" || s.carrera?._id === careerFilter;
    return matchSearch && matchCareer;
  });

  return (
    <div className="subjects-container">
      <div className="subjects-header">
        <div>
          <h2>Gestión de Materias</h2>
          <p>Administra materias base del sistema</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/admin/subjects/nueva")}>
          + Nueva Materia
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee', color: '#c33', borderRadius: 8, margin: '16px 0' }}>
          {error}
        </div>
      )}

      <div className="subjects-filters">
        <input type="text" placeholder="Buscar materia por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={careerFilter} onChange={(e) => setCareerFilter(e.target.value)}>
          <option value="todas">Todas las carreras</option>
          {careers.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="subjects-table desktop-only">
        <div className="table-header">
          <span>Materia</span>
          <span>Código</span>
          <span>Carrera</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <p style={{ padding: 20, textAlign: 'center' }}>Cargando materias...</p>
        ) : filtered.length > 0 ? (
          filtered.map((s) => (
            <div key={s._id} className="table-row">
              <span style={{ fontWeight: 600 }}>{s.nombre}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{s.codigo}</span>
              <span>{s.carrera?.nombre || '-'}</span>
              <div className="actions">
                <button title="Editar" onClick={() => navigate(`/admin/subjects/editar/${s._id}`)}>✏️</button>
                <button title="Eliminar" onClick={() => handleDelete(s._id, s.nombre)}>🗑️</button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ padding: 20, textAlign: 'center' }}>No se encontraron materias.</p>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="mobile-only-cards">
        {loading ? (
          <p>Cargando...</p>
        ) : filtered.length > 0 ? (
          filtered.map((s) => (
            <div key={s._id} className="career-mobile-card">
              <div className="card-row header">
                <span className="name">{s.nombre}</span>
                <span className="code">{s.codigo}</span>
              </div>
              <div className="card-stats-grid">
                <div><label>Carrera</label><span>{s.carrera?.nombre || '-'}</span></div>
              </div>
              <div className="card-actions">
                <button className="btn secondary" onClick={() => navigate(`/admin/subjects/editar/${s._id}`)}>Editar</button>
                <button className="btn secondary" style={{ color: 'var(--error)' }} onClick={() => handleDelete(s._id, s.nombre)}>Eliminar</button>
              </div>
            </div>
          ))
        ) : (
          <p>No se encontraron materias.</p>
        )}
      </div>

      <div className="correlatives-box">
        <h4>🔗 Configuración de Planes de Estudio</h4>
        <p>
          Recuerda: las correlatividades, el año, el cuatrimestre y los requisitos (como materias UNAHUR u Optativas)
          se definen ahora directamente en la gestión de <strong>Planes de Estudio</strong>.
          Aquí solo das de alta la materia con su nombre y código único.
        </p>
      </div>
    </div>
  );
}
