import "../styles/CreateSession.css";
import { useState } from "react";

export default function CreateSessionForm() {
  const [modalidad, setModalidad] = useState("presencial");

  return (
    <div className="create-session-container">
      <div className="create-session-card">

        <div className="form-group">
          <label>Materia</label>
          <select className="select">
            <option>Seleccionar materia</option>
          </select>
        </div>

        <div className="form-group">
          <label>Título</label>
          <input className="input" placeholder="Ej: Repaso final" />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea className="textarea" />
        </div>

        <div className="grid-2 form-group">
          <input type="date" className="input" />
          <input type="time" className="input" />
        </div>

        <div className="form-group">
          <label>Modalidad</label>

          <div className="grid-2">
            <div
              className={`modalidad-box ${
                modalidad === "presencial" ? "active" : ""
              }`}
              onClick={() => setModalidad("presencial")}
            >
              Presencial
            </div>

            <div
              className={`modalidad-box ${
                modalidad === "virtual" ? "active" : ""
              }`}
              onClick={() => setModalidad("virtual")}
            >
              Virtual
            </div>
          </div>
        </div>

        <div className="buttons-row">
          <button className="btn-secondary">Cancelar</button>
          <button className="btn-primary">Crear Sesión</button>
        </div>

      </div>
    </div>
  );
}