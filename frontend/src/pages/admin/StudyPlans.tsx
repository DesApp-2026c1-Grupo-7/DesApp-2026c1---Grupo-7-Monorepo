import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/StudyPlans.css";

interface StudyPlan {
  _id: string;
  nombre: string;
  anio: number;
  carrera?: { _id: string; nombre: string; };
  materias: Array<{ _id: string; nombre: string; codigo: string }>;
  creditosNecesarios?: number;
  creditosOptativasNecesarios?: number;
  nivelInglesRequerido?: string;
  activo: boolean;
}

const StudyPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [careerFilter, setCareerFilter] = useState("todas");
  const [error, setError] = useState("");

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const r = await api.get("/planes");
      setPlans(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el plan "${nombre}"?`)) return;
    try {
      await api.delete(`/planes/${id}`);
      await fetchPlans();
      setError("");
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al eliminar el plan");
    }
  };

  const carreraOptions = Array.from(new Set(
    plans.filter((p) => p.carrera).map((p) => p.carrera!._id)
  )).map((id) => plans.find((p) => p.carrera?._id === id)!.carrera!);

  const filtered = plans.filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCareer = careerFilter === "todas" || p.carrera?._id === careerFilter;
    return matchSearch && matchCareer;
  });

  return (
    <div className="plans-container">
      <div className="plans-header">
        <div>
          <h1>Planes de Estudio</h1>
          <p>Gestiona los planes académicos por carrera</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/admin/studyplans/nuevo")}>
          + Nuevo Plan
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee', color: '#c33', borderRadius: 8, margin: '16px 0' }}>
          {error}
        </div>
      )}

      <div className="plans-filters">
        <input
          type="text"
          placeholder="🔍 Buscar plan..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="filter-select" value={careerFilter} onChange={(e) => setCareerFilter(e.target.value)}>
          <option value="todas">Todas las carreras</option>
          {carreraOptions.map((c) => (
            <option key={c._id} value={c._id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="plans-list">
        {loading ? (
          <p style={{ padding: 20, textAlign: 'center', gridColumn: '1 / -1' }}>Cargando planes...</p>
        ) : filtered.length > 0 ? (
          filtered.map((plan) => (
            <div key={plan._id} className="plan-card">
              <div className="plan-top">
                <div>
                  <h3>{plan.carrera?.nombre || 'Sin carrera'}</h3>
                  <span className="plan-subtitle">{plan.nombre} ({plan.anio})</span>
                </div>
                <span className={`status-badge ${plan.activo ? 'active' : 'inactive'}`}>
                  {plan.activo ? 'Vigente' : 'Inactivo'}
                </span>
              </div>

              <div className="plan-info">
                <div><span className="label">Año</span><p>{plan.anio}</p></div>
                <div><span className="label">Materias</span><p>{plan.materias.length}</p></div>
                <div><span className="label">Créditos</span><p>{plan.creditosNecesarios || 0}</p></div>
              </div>

              <div className="plan-actions">
                <button className="btn-outline" onClick={() => navigate(`/admin/studyplans/${plan._id}`)}>
                  📄 Ver Materias
                </button>
                <button className="btn-primary" onClick={() => navigate(`/admin/studyplans/editar/${plan._id}`)}>
                  ✏️ Editar
                </button>
                <button className="btn-outline" style={{ color: '#c33' }} onClick={() => handleDelete(plan._id, plan.nombre)}>
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ padding: 20, textAlign: 'center', gridColumn: '1 / -1' }}>No se encontraron planes.</p>
        )}
      </div>
    </div>
  );
};

export default StudyPlans;
