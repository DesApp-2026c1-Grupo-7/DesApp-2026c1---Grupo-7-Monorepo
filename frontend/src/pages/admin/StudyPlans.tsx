import { useEffect, useState } from "react";
import "../../styles/StudyPlans.css";
import api from "../../services/api";

interface StudyPlan {
  _id: string;
  nombre: string;
  anio: number;
  carrera: {
    _id: string;
    nombre: string;
  };
  materias: string[];
  activo: boolean;
}

const StudyPlans = () => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/planes")
      .then((response) => { setPlans(response.data); })
      .catch((error) => { console.error("Error al obtener planes:", error); })
      .finally(() => { setLoading(false); });
  }, []);

  return (
    <div className="plans-container">
      {/* Header */}
      <div className="plans-header">
        <div>
          <h1>Planes de Estudio</h1>
          <p>Gestiona los planes académicos por carrera</p>
        </div>

        <button className="btn-primary">+ Nuevo Plan</button>
      </div>

      {/* Filtros */}
      <div className="plans-filters">
        <input
          type="text"
          placeholder="🔍 Buscar plan..."
          className="search-input"
        />

        <select className="filter-select">
          <option>Todas las carreras</option>
        </select>
      </div>

      {/* Cards */}
      <div className="plans-list">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', gridColumn: '1 / -1' }}>Cargando planes...</p>
        ) : plans.length > 0 ? (
          plans.map((plan) => (
            <div key={plan._id} className="plan-card">
              <div className="plan-top">
                <div>
                  <h3>{plan.carrera?.nombre || 'Carrera no especificada'}</h3>
                  <span className="plan-subtitle">{plan.nombre} ({plan.anio})</span>
                </div>

                <span className={`status-badge ${plan.activo ? 'active' : 'inactive'}`}>
                  {plan.activo ? 'Vigente' : 'Inactivo'}
                </span>
              </div>

              <div className="plan-info">
                <div>
                  <span className="label">Año</span>
                  <p>{plan.anio}</p>
                </div>

                <div>
                  <span className="label">Materias</span>
                  <p>{plan.materias.length}</p>
                </div>

                <div>
                  <span className="label">Estado</span>
                  <p>{plan.activo ? 'Vigente' : 'Inactivo'}</p>
                </div>
              </div>

              <div className="plan-actions">
                <button className="btn-outline">📄 Ver Materias</button>
                <button className="btn-primary">✏️ Editar Plan</button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ padding: '20px', textAlign: 'center', gridColumn: '1 / -1' }}>No se encontraron planes de estudio.</p>
        )}
      </div>
    </div>
  );
};

export default StudyPlans;