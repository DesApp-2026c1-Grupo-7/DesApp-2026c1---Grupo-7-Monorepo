import { useEffect, useState } from "react";
import "../../styles/Subjects.css";
import api from "../../services/api";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
  anio: number;
  cuatrimestre: number;
  creditos: number;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("todos");

  useEffect(() => {
    api.get("/materias")
      .then((response) => { setSubjects(response.data); })
      .catch((error) => { console.error("Error al obtener materias:", error); })
      .finally(() => { setLoading(false); });
  }, []);

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.nombre
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesYear =
      yearFilter === "todos" || subject.anio.toString() === yearFilter;

    return matchesSearch && matchesYear;
  });

  return (
    <div className="subjects-container">
      {/* HEADER */}
      <div className="subjects-header">
        <div>
          <h2>Gestión de Materias</h2>
          <p>Administra materias y correlatividades</p>
        </div>

        <button className="btn-primary">+ Nueva Materia</button>
      </div>

      {/* FILTROS */}
      <div className="subjects-filters">
        <input
          type="text"
          placeholder="Buscar materia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setYearFilter(e.target.value)}>
          <option value="todos">Todos los años</option>
          <option value="1">1°</option>
          <option value="2">2°</option>
          <option value="3">3°</option>
          <option value="4">4°</option>
          <option value="5">5°</option>
        </select>
      </div>

      {/* TABLA */}
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
          <p style={{ padding: '20px', textAlign: 'center' }}>Cargando materias...</p>
        ) : filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => (
            <div key={subject._id} className="table-row">
              <span>{subject.nombre}</span>
              <span>{subject.codigo}</span>
              <span>{subject.anio}°</span>
              <span>{subject.cuatrimestre === 0 ? 'Anual' : `${subject.cuatrimestre}°`}</span>
              <span>{subject.creditos}</span>

              <div className="actions">
                <button title="Correlativas">🔗</button>
                <button title="Editar">✏️</button>
                <button title="Eliminar">🗑️</button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ padding: '20px', textAlign: 'center' }}>No se encontraron materias.</p>
        )}
      </div>

      {/* BLOQUE INFERIOR */}
      <div className="correlatives-box">
        <h4>🔗 Gestión de Correlatividades</h4>
        <p>
          Las correlatividades definen qué materias deben estar aprobadas para
          poder cursar otras. Haz clic en el icono de correlatividades para
          editar las dependencias de cada materia.
        </p>

        <button className="btn-primary-outline">
          Ver Diagrama de Correlatividades
        </button>
      </div>
    </div>
  );
}