import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Situation.css";

type Materia = {
  nombre: string;
  anio: string;
  estado: string;
  nota: string;
  fecha: string;
};

const data: Materia[] = [
  { nombre: "Algoritmos y Estructuras de Datos", anio: "1°", estado: "Aprobada", nota: "8", fecha: "14/12/2023" },
  { nombre: "Programación I", anio: "1°", estado: "Aprobada", nota: "9", fecha: "9/12/2023" },
  { nombre: "Matemática I", anio: "1°", estado: "Aprobada", nota: "7", fecha: "19/2/2024" },
  { nombre: "Sistemas Operativos", anio: "2°", estado: "Regularizada", nota: "-", fecha: "14/7/2024" },
  { nombre: "Base de Datos", anio: "2°", estado: "Regularizada", nota: "-", fecha: "17/7/2024" },
  { nombre: "Redes de Computadoras", anio: "3°", estado: "Cursando", nota: "-", fecha: "-" },
  { nombre: "Ingeniería de Software", anio: "3°", estado: "Cursando", nota: "-", fecha: "-" },
  { nombre: "Inteligencia Artificial", anio: "4°", estado: "Pendiente", nota: "-", fecha: "-" },
];

const Situation = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Todos los estados");

  const [openYear, setOpenYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState("Todos los años");

  const [search, setSearch] = useState("");

  const options = ["Todos los estados", "Aprobada", "Regularizada", "Cursando", "Pendiente"];
  const yearOptions = ["Todos los años", "1°", "2°", "3°", "4°"];

  const filteredData = data.filter((m) => {
    const matchEstado = selected === "Todos los estados" || m.estado === selected;
    const matchYear = selectedYear === "Todos los años" || m.anio === selectedYear;
    const matchSearch = m.nombre.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchYear && matchSearch;
  });

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case "Aprobada": return "badge green";
      case "Regularizada": return "badge blue";
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
            {filteredData.map((m, i) => (
              <tr key={i}>
                <td>{m.nombre}</td>
                <td>{m.anio}</td>
                <td><span className={getBadgeClass(m.estado)}>{m.estado}</span></td>
                <td>{m.nota}</td>
                <td>{m.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Situation;