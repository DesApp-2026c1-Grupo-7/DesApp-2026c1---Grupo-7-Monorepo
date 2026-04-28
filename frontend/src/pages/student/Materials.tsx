import { useState } from "react";
import "../../styles/Materials.css";

interface Material {
  id: number;
  titulo: string;
  materia: string;
  autor: string;
  fecha: string;
  tipo: string;
  likes: number;
  dislikes: number;
  descargas: number;
}

export default function Materials() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todas");

  const materiales: Material[] = [
    {
      id: 1,
      titulo: "Resumen Normalización de BD",
      materia: "Base de Datos",
      autor: "Ana López",
      fecha: "9/5/2024",
      tipo: "PDF",
      likes: 24,
      dislikes: 2,
      descargas: 156,
    },
    {
      id: 2,
      titulo: "Ejercicios Resueltos - SQL",
      materia: "Base de Datos",
      autor: "Carlos Ruiz",
      fecha: "7/5/2024",
      tipo: "PDF",
      likes: 31,
      dislikes: 1,
      descargas: 203,
    },
    {
      id: 3,
      titulo: "Guía de Estudio Completa",
      materia: "Redes de Computadoras",
      autor: "María González",
      fecha: "4/5/2024",
      tipo: "DOCX",
      likes: 18,
      dislikes: 3,
      descargas: 94,
    },
    {
      id: 4,
      titulo: "Slides de Clase - Capas OSI",
      materia: "Redes de Computadoras",
      autor: "Pedro Martínez",
      fecha: "1/5/2024",
      tipo: "PPTX",
      likes: 12,
      dislikes: 0,
      descargas: 67,
    },
  ];

  const filtrados = materiales.filter((m) => {
    const matchSearch = m.titulo.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "todas" || m.materia.toLowerCase().includes(filter.toLowerCase());

    return matchSearch && matchFilter;
  });

  return (
    <div className="materials-container">
      {/* HEADER */}
      <div className="materials-header">
        <div>
          <h2>Materiales de Estudio</h2>
          <p>Comparte y accede a recursos académicos</p>
        </div>

        <button className="btn-primary">+ Subir Material</button>
      </div>

      {/* FILTROS */}
      <div className="materials-filters">
        <input
          type="text"
          placeholder="Buscar materiales..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="todas">Todas las materias</option>
          <option value="base">Base de Datos</option>
          <option value="redes">Redes de Computadoras</option>
        </select>
      </div>

      {/* LISTA */}
      <div className="materials-list">
        {filtrados.map((m) => (
          <div key={m.id} className="material-card">
            <div className="material-left">
              <div className="file-icon">📄</div>

              <div>
                <h4>{m.titulo}</h4>
                <span className="materia">{m.materia}</span>

                <p className="meta">
                  Por {m.autor} • {m.fecha} • {m.tipo}
                </p>
              </div>
            </div>

            <div className="material-right">
              <span className="like">👍 {m.likes}</span>
              <span className="dislike">👎 {m.dislikes}</span>
              <span className="downloads">⬇ {m.descargas} descargas</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}