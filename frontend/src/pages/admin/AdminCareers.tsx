import { useEffect, useState } from "react";
import "../../styles/AdminCareers.css";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Career {
  _id: string;
  nombre: string;
  codigo: string;
  cantidadEstudiantes: number;
  cantidadMaterias: number;
}

export default function AdminCareers() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/carreras")
      .then((response) => { setCareers(response.data); })
      .catch((error) => { console.error("Error al obtener carreras:", error); })
      .finally(() => { setLoading(false); });
  }, []);

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
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Cargando carreras...</p>
        ) : (
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
              {careers.map((c) => (
                <tr key={c._id}>
                  <td>{c.nombre}</td>
                  <td className="code">{c.codigo}</td>
                  <td>{c.cantidadEstudiantes}</td>
                  <td>{c.cantidadMaterias}</td>

                  <td className="actions">
                    <button className="icon-btn edit">✏️</button>
                    <button className="icon-btn delete">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}