import { useState, useEffect } from "react";
import { getPlanes, createPlan, deletePlan, type PlanEstudio } from "../../services/planes.service";
import { getCarreras, type Carrera } from "../../services/carreras.service";
import "../../styles/StudyPlans.css";

const StudyPlans = () => {
  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formCarrera, setFormCarrera] = useState("");
  const [formAnio, setFormAnio] = useState(new Date().getFullYear());
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([getPlanes(), getCarreras()]).then(([p, c]) => {
      setPlanes(p);
      setCarreras(c);
      if (c.length > 0) setFormCarrera(c[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formCarrera || !formAnio) {
      setFormError("Carrera y año son obligatorios");
      return;
    }
    try {
      const nuevo = await createPlan({ carrera: formCarrera, anio: formAnio });
      setPlanes((prev) => [nuevo, ...prev]);
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Error al crear el plan");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return;
    await deletePlan(id);
    setPlanes((prev) => prev.filter((p) => p._id !== id));
  }

  return (
    <div className="plans-container">
      {/* Header */}
      <div className="plans-header">
        <div>
          <h1>Planes de Estudio</h1>
          <p>Gestiona los planes académicos por carrera</p>
        </div>

        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Nuevo Plan"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {formError && <p style={{ color: "#e74c3c", fontSize: "0.9rem", margin: 0 }}>{formError}</p>}
          <select value={formCarrera} onChange={(e) => setFormCarrera(e.target.value)}>
            {carreras.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
          </select>
          <input type="number" placeholder="Año" value={formAnio} onChange={(e) => setFormAnio(Number(e.target.value))} />
          <button type="submit" className="btn-primary">Crear Plan</button>
        </form>
      )}

      {/* Cards */}
      <div className="plans-list">
        {loading ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>Cargando planes...</p>
        ) : planes.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>No hay planes de estudio creados aún</p>
        ) : (
          planes.map((plan) => (
            <div key={plan._id} className="plan-card">
              <div className="plan-top">
                <div>
                  <h3>{plan.carrera?.nombre || "Sin carrera"}</h3>
                  <span className="plan-subtitle">Plan {plan.anio}</span>
                </div>

                <span className="status-badge">{plan.estado}</span>
              </div>

              <div className="plan-info">
                <div>
                  <span className="label">Año</span>
                  <p>{plan.anio}</p>
                </div>

                <div>
                  <span className="label">Materias</span>
                  <p>{plan.materias?.length || 0}</p>
                </div>

                <div>
                  <span className="label">Estado</span>
                  <p>{plan.estado}</p>
                </div>
              </div>

              <div className="plan-actions">
                <button className="btn-outline" onClick={() => handleDelete(plan._id)}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudyPlans;
