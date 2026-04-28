import "../../styles/AdminCareers.css";
import { useNavigate } from "react-router-dom";

const careers = [
  {
    nombre: "Ingeniería en Sistemas",
    codigo: "INGSIST",
    estudiantes: 450,
    materias: 47,
  },
  {
    nombre: "Licenciatura en Informática",
    codigo: "LICINF",
    estudiantes: 320,
    materias: 42,
  },
  {
    nombre: "Ingeniería Industrial",
    codigo: "INGIND",
    estudiantes: 280,
    materias: 45,
  },
  {
    nombre: "Ingeniería Electrónica",
    codigo: "INGELEC",
    estudiantes: 197,
    materias: 44,
  },
];

export default function AdminCareers() {
  const navigate = useNavigate();
  return (
    <div className="admin-careers-container">
      
      {/* Header */}
      <div className="admin-careers-header">
        <div>
          <h1>Gestión de Carreras</h1>
          <p>Administra las carreras disponibles</p>
        </div>

        <button
          className="btn-primary"
           onClick={() => navigate("/admin/carreras/nueva")}
        >
          + Nueva Carrera
        </button>
      </div>

      {/* Buscador */}
      <div className="admin-search-box">
        <input placeholder="Buscar carrera..." />
      </div>

      {/* Tabla */}
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Carrera</th>
              <th>Código</th>
              <th>Estudiantes</th>
              <th>Materias</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {careers.map((c, index) => (
              <tr key={index}>
                <td>{c.nombre}</td>
                <td className="code">{c.codigo}</td>
                <td>{c.estudiantes}</td>
                <td>{c.materias}</td>

                <td className="actions">
                  <button className="icon-btn edit">✏️</button>
                  <button className="icon-btn delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}