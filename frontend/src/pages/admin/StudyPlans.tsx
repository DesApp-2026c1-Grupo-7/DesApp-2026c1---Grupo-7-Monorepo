    import "../../styles/StudyPlans.css";

const plans = [
  {
    career: "Ingeniería en Sistemas",
    year: 2023,
    subjects: 47,
    status: "Vigente",
  },
  {
    career: "Licenciatura en Informática",
    year: 2023,
    subjects: 42,
    status: "Vigente",
  },
  {
    career: "Ingeniería Industrial",
    year: 2022,
    subjects: 45,
    status: "Vigente",
  },
];

const StudyPlans = () => {
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
          <option>Ingeniería en Sistemas</option>
          <option>Licenciatura en Informática</option>
          <option>Ingeniería Industrial</option>
        </select>
      </div>

      {/* Cards */}
      <div className="plans-list">
        {plans.map((plan, index) => (
          <div key={index} className="plan-card">
            <div className="plan-top">
              <div>
                <h3>{plan.career}</h3>
                <span className="plan-subtitle">Plan {plan.year}</span>
              </div>

              <span className="status-badge">{plan.status}</span>
            </div>

            <div className="plan-info">
              <div>
                <span className="label">Año</span>
                <p>{plan.year}</p>
              </div>

              <div>
                <span className="label">Materias</span>
                <p>{plan.subjects}</p>
              </div>

              <div>
                <span className="label">Estado</span>
                <p>{plan.status}</p>
              </div>
            </div>

            <div className="plan-actions">
              <button className="btn-outline">📄 Ver Materias</button>
              <button className="btn-primary">✏️ Editar Plan</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyPlans;