import { useState } from "react";
import "../../styles/Subjects.css";

interface Subject {
  id: number;
  name: string;
  code: string;
  year: number;
  career: string;
  correlatives: string;
}

const mockSubjects: Subject[] = [
  {
    id: 1,
    name: "Algoritmos y Estructuras de Datos",
    code: "ALGO101",
    year: 1,
    career: "Ing. Sistemas",
    correlatives: "-",
  },
  {
    id: 2,
    name: "Programación I",
    code: "PROG101",
    year: 1,
    career: "Ing. Sistemas",
    correlatives: "-",
  },
  {
    id: 3,
    name: "Sistemas Operativos",
    code: "SIST201",
    year: 2,
    career: "Ing. Sistemas",
    correlatives: "Programación I",
  },
  {
    id: 4,
    name: "Base de Datos",
    code: "BD201",
    year: 2,
    career: "Ing. Sistemas",
    correlatives: "Algoritmos y Estructuras",
  },
  {
    id: 5,
    name: "Redes de Computadoras",
    code: "REDES301",
    year: 3,
    career: "Ing. Sistemas",
    correlatives: "Sistemas Operativos",
  },
];

export default function Subjects() {
  const [search, setSearch] = useState("");
  const [careerFilter, setCareerFilter] = useState("todas");
  const [yearFilter, setYearFilter] = useState("todos");

  const filteredSubjects = mockSubjects.filter((subject) => {
    const matchesSearch = subject.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCareer =
      careerFilter === "todas" || subject.career === careerFilter;

    const matchesYear =
      yearFilter === "todos" || subject.year.toString() === yearFilter;

    return matchesSearch && matchesCareer && matchesYear;
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

        <select onChange={(e) => setCareerFilter(e.target.value)}>
          <option value="todas">Todas las carreras</option>
          <option value="Ing. Sistemas">Ing. Sistemas</option>
        </select>

        <select onChange={(e) => setYearFilter(e.target.value)}>
          <option value="todos">Todos los años</option>
          <option value="1">1°</option>
          <option value="2">2°</option>
          <option value="3">3°</option>
        </select>
      </div>

      {/* TABLA */}
      <div className="subjects-table">
        <div className="table-header">
          <span>Materia</span>
          <span>Código</span>
          <span>Año</span>
          <span>Carrera</span>
          <span>Correlativas</span>
          <span>Acciones</span>
        </div>

        {filteredSubjects.map((subject) => (
          <div key={subject.id} className="table-row">
            <span>{subject.name}</span>
            <span>{subject.code}</span>
            <span>{subject.year}°</span>
            <span className="career">{subject.career}</span>
            <span>{subject.correlatives}</span>

            <div className="actions">
              <button title="Correlativas">🔗</button>
              <button title="Editar">✏️</button>
              <button title="Eliminar">🗑️</button>
            </div>
          </div>
        ))}
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