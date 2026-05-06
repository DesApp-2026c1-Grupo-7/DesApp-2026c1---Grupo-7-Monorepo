import { useEffect, useState } from "react";
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
  anio: number;
  cuatrimestre: number;
  creditos: number;
  carrera?: Career;
  esOptativa?: boolean;
  esUnahur?: boolean;
  correlativas?: { nombre: string; codigo: string }[];
}

export default function Subjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [careerFilter, setCareerFilter] = useState("todas");
  const [yearFilter, setYearFilter] = useState("todos");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subRes, carRes] = await Promise.all([
        api.get("/materias"),
        api.get("/carreras")
      ]);
      setSubjects(subRes.data);
      setCareers(carRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

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
    const matchYear = yearFilter === "todos" || s.anio.toString() === yearFilter;
    return matchSearch && matchCareer && matchYear;
  });

  const cuatriLabel = (c: number) => c === 0 ? "Anual" : `${c}°C`;

  return (
    <div className="subjects-container">
      <div className="subjects-header">
        <div>
          <h2>Gestión de Materias</h2>
          <p>Administra materias, planes y correlatividades</p>
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
        <input type="text" placeholder="Buscar materia..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={careerFilter} onChange={(e) => setCareerFilter(e.target.value)}>
          <option value="todas">Todas las carreras</option>
          {careers.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="todos">Todos los años</option>
          {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}°</option>)}
        </select>
      </div>

      <div className="subjects-table">
        <div className="table-header">
          <span>Materia</span>
          <span>Código</span>
          <span>Año</span>
          <span>Cuat.</span>
          <span>Créditos</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <p style={{ padding: 20, textAlign: 'center' }}>Cargando materias...</p>
        ) : filtered.length > 0 ? (
          filtered.map((s) => (
            <div key={s._id} className="table-row">
              <span>
                {s.nombre}
                {s.esOptativa && <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 4 }}>Optativa</span>}
                {s.esUnahur === false && <span style={{ marginLeft: 4, fontSize: 11, padding: '2px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: 4 }}>No-UNAHUR</span>}
              </span>
              <span>{s.codigo}</span>
              <span>{s.anio}°</span>
              <span>{cuatriLabel(s.cuatrimestre)}</span>
              <span>{s.creditos}</span>
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

      <div className="correlatives-box">
        <h4>🔗 Gestión de Correlatividades</h4>
        <p>
          Las correlatividades se definen al editar cada materia. Las materias con correlativas
          requieren tener aprobadas las anteriores antes de poder cursarse.
        </p>
      </div>
    </div>
  );
}
