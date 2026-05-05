import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Situation.css";

interface AcademicRecord {
  _id: string;
  materia: {
    nombre: string;
    anio: number;
  };
  estado: string;
  nota?: number;
  fecha: string;
}

const Situation = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Todos los estados");
  const [openYear, setOpenYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState("Todos los años");
  const [search, setSearch] = useState("");

  const options = ["Todos los estados", "Aprobada", "Regular", "Cursando", "Pendiente"];
  const yearOptions = ["Todos los años", "1°", "2°", "3°", "4°", "5°"];

  useEffect(() => {
    fetchSituation();
  }, []);

  const fetchSituation = async () => {
    try {
      const response = await api.get("/academico/situacion");
      setData(response.data);
    } catch (error) {
      console.error("Error al obtener situación académica:", error);
    } finally {
      setLoading(false);
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
          <p>Historial de materias cursadas</p>
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
              </tr>
            </thead>

            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((m) => (
                  <tr key={m._id}>
                    <td>{m.materia.nombre}</td>
                    <td>{m.materia.anio}°</td>
                    <td><span className={getBadgeClass(m.estado)}>{m.estado}</span></td>
                    <td>{m.nota || "-"}</td>
                    <td>{new Date(m.fecha).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No hay registros académicos.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default Situation;