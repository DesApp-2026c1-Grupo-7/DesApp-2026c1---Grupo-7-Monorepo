import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Situation.css";

interface AcademicRecord {
  _id: string;
  materia: {
    _id: string;
    nombre: string;
    anio: number;
  };
  estado: string;
  nota?: number;
  fecha: string;
}

interface CreditActivity {
  _id: string;
  nombre: string;
  creditos: number;
  fecha: string;
}

const Situation = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AcademicRecord[]>([]);
  const [activities, setActivities] = useState<CreditActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Todos los estados");
  const [openYear, setOpenYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState("Todos los años");
  const [search, setSearch] = useState("");

  // Estado para el modal personalizado
  const [showModal, setShowModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<{ id: string, nombre: string } | null>(null);

  const options = ["Todos los estados", "Aprobada", "Regular", "Cursando", "Pendiente"];
  const yearOptions = ["Todos los años", "1°", "2°", "3°", "4°", "5°"];

  const fetchSituation = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true);
    Promise.all([
      api.get("/academico/situacion"),
      api.get("/academico/actividades-creditos")
    ])
      .then(([resSit, resAct]) => {
        setData(resSit.data);
        setActivities(resAct.data);
      })
      .catch((error) => { console.error("Error al obtener datos académicos:", error); })
      .finally(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSituation();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSituation]);

  const openDeleteModal = (id: string, nombre: string) => {
    setSubjectToDelete({ id, nombre });
    setShowModal(true);
  };

  const closeDeleteModal = () => {
    setShowModal(false);
    setSubjectToDelete(null);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;

    try {
      await api.delete(`/academico/situacion/${subjectToDelete.id}`);
      fetchSituation(true); // Aquí sí queremos ver el loading al recargar
      closeDeleteModal();
    } catch (error) {
      console.error("Error al dar de baja la materia:", error);
      alert("No se pudo dar de baja la materia");
    }
  };

  const filteredData = data.filter((m) => {
    const matchEstado = selected === "Todos los estados" || m.estado === (selected === "Regularizada" ? "Regular" : selected);
    const matchYear = selectedYear === "Todos los años" || `${m.materia.anio}°` === selectedYear;
    const matchSearch = m.materia.nombre.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchYear && matchSearch;
  });

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case "Aprobada": return "badge green";
      case "Regular": return "badge blue";
      case "Cursando": return "badge yellow";
      case "Pendiente": return "badge gray";
      default: return "badge";
    }
  };

  return (
    <div className="situation">

      <div className="header">
        <div>
          <h1>Situación Académica</h1>
          <p>Historial de materias y actividades</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate("/student/load-situation")}
        >
          + Cargar Datos
        </button>
      </div>

      <div className="filters">
        <input
          placeholder="Buscar materia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Dropdown estados */}
        <div className="dropdown">
          <div
            className="dropdown-selected"
            onClick={() => {
              setOpen(!open);
              setOpenYear(false);
            }}
          >
            <span>{selected}</span>
            <span className={`arrow ${open ? "open" : ""}`}>▼</span>
          </div>

          {open && (
            <div className="dropdown-menu">
              {options.map((opt) => (
                <div
                  key={opt}
                  className={`dropdown-item ${selected === opt ? "active" : ""}`}
                  onClick={() => {
                    setSelected(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown años */}
        <div className="dropdown">
          <div
            className="dropdown-selected"
            onClick={() => {
              setOpenYear(!openYear);
              setOpen(false);
            }}
          >
            <span>{selectedYear}</span>
            <span className={`arrow ${openYear ? "open" : ""}`}>▼</span>
          </div>

          {openYear && (
            <div className="dropdown-menu">
              {yearOptions.map((opt) => (
                <div
                  key={opt}
                  className={`dropdown-item ${selectedYear === opt ? "active" : ""}`}
                  onClick={() => {
                    setSelectedYear(opt);
                    setOpenYear(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 20 }}>
        <h2>Materias</h2>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Cargando situación académica...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Año</th>
                <th>Estado</th>
                <th>Nota</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((m) => (
                  <tr key={m._id}>
                    <td>{m.materia.nombre}</td>
                    <td>{m.materia.anio === 0 ? "U" : `${m.materia.anio}°`}</td>
                    <td><span className={getBadgeClass(m.estado)}>{m.estado}</span></td>
                    <td>{m.nota || "-"}</td>
                    <td>{new Date(m.fecha).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className={m.estado === 'Aprobada' || m.estado === 'Promocion' ? 'btn-disabled' : 'btn-danger'}
                        onClick={() => openDeleteModal(m.materia._id, m.materia.nombre)}
                        disabled={m.estado === 'Aprobada' || m.estado === 'Promocion'}
                        title={m.estado === 'Aprobada' || m.estado === 'Promocion' ? "No se puede dar de baja una materia aprobada" : ""}
                      >
                        Darse de baja
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No hay registros académicos.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MOBILE CARDS FOR SUBJECTS */}
      <div className="mobile-cards">
        {loading ? (
          <p>Cargando...</p>
        ) : filteredData.length > 0 ? (
          filteredData.map((m) => (
            <div key={m._id} className="situation-card">
              <div className="card-header">
                <span className="name">{m.materia.nombre}</span>
                <span className="year">{m.materia.anio === 0 ? "U" : `${m.materia.anio}°`}</span>
              </div>
              <div className="card-content-grid">
                <div>
                  <label>Estado</label>
                  <span className={getBadgeClass(m.estado)} style={{ width: 'fit-content', marginTop: 4 }}>{m.estado}</span>
                </div>
                <div>
                  <label>Nota</label>
                  <span>{m.nota || "-"}</span>
                </div>
                <div>
                  <label>Fecha</label>
                  <span>{new Date(m.fecha).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="card-footer">
                <button 
                  className={m.estado === 'Aprobada' || m.estado === 'Promocion' ? 'btn-disabled' : 'btn-danger'}
                  style={{ width: '100%' }}
                  onClick={() => openDeleteModal(m.materia._id, m.materia.nombre)}
                  disabled={m.estado === 'Aprobada' || m.estado === 'Promocion'}
                >
                  Darse de baja
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', padding: '20px' }}>No hay registros académicos.</p>
        )}
      </div>

      <div className="section-title" style={{ marginTop: 40 }}>
        <h2>Actividades</h2>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Cargando actividades...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Estado</th>
                <th>Créditos</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody>
              {activities.length > 0 ? (
                activities.map((a) => (
                  <tr key={a._id}>
                    <td>{a.nombre}</td>
                    <td><span className="badge green">Aprobada</span></td>
                    <td>{a.creditos}</td>
                    <td>{new Date(a.fecha).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>No hay actividades registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MOBILE CARDS FOR ACTIVITIES */}
      <div className="mobile-cards">
        {loading ? (
          <p>Cargando...</p>
        ) : activities.length > 0 ? (
          activities.map((a) => (
            <div key={a._id} className="situation-card">
              <div className="card-header">
                <span className="name">{a.nombre}</span>
              </div>
              <div className="card-content-grid">
                <div>
                  <label>Estado</label>
                  <span className="badge green" style={{ width: 'fit-content', marginTop: 4 }}>Aprobada</span>
                </div>
                <div>
                  <label>Créditos</label>
                  <span>{a.creditos}</span>
                </div>
                <div>
                  <label>Fecha</label>
                  <span>{new Date(a.fecha).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', padding: '20px' }}>No hay actividades registradas.</p>
        )}
      </div>

      {/* Modal de confirmación personalizado */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>¿Confirmar baja?</h2>
            <p>
              ¿Estás seguro de que quieres darte de baja de <strong>{subjectToDelete?.nombre}</strong>? 
              Se eliminará de tu situación académica y volverá a estar pendiente.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeDeleteModal}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Situation;