import "../styles/CreateSession.css";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
}

interface CreateSessionFormProps {
  sessionId?: string;
}

export default function CreateSessionForm({ sessionId }: CreateSessionFormProps) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!sessionId);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    materia: "",
    tema: "",
    tipo: "presencial",
    link: "",
    ubicacion: "",
    fecha: "",
    hora: "",
    duracionHoras: 1,
    duracionMinutos: 0,
    cupos: "" as number | "",
    descripcion: "",
    requiereAprobacion: false
  });

  useEffect(() => {
    // Cargar materias
    api.get("/materias")
      .then((res) => setSubjects(res.data))
      .catch(() => setError("No se pudieron cargar las materias"));

    // Si es edición, cargar datos de la sesión
    if (sessionId) {
      api.get(`/sesiones/${sessionId}`)
        .then((res) => {
          const s = res.data;
          const dt = new Date(s.fechaHora);
          const fecha = dt.toISOString().split('T')[0];
          const hora = dt.toTimeString().split(' ')[0].substring(0, 5);

          setFormData({
            materia: s.materia?._id || "",
            tema: s.tema,
            tipo: s.tipo,
            link: s.link || "",
            ubicacion: s.ubicacion || "",
            fecha,
            hora,
            duracionHoras: s.duracion.horas,
            duracionMinutos: s.duracion.minutos,
            cupos: s.cupos || "",
            descripcion: s.descripcion || "",
            requiereAprobacion: s.requiereAprobacion
          });
        })
        .catch(() => setError("No se pudieron cargar los datos de la sesión"))
        .finally(() => setInitialLoading(false));
    }
  }, [sessionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validaciones front-end
      if (!formData.materia || !formData.tema || !formData.fecha || !formData.hora) {
        throw new Error("Por favor completa los campos obligatorios");
      }

      if (formData.tipo === 'virtual' && !formData.link) {
        throw new Error("El link de la videollamada es obligatorio para sesiones virtuales");
      }

      if (formData.tipo === 'presencial' && !formData.ubicacion) {
        throw new Error("La ubicación es obligatoria para sesiones presenciales");
      }

      const payload = {
        materia: formData.materia,
        tema: formData.tema,
        tipo: formData.tipo,
        link: formData.tipo === 'virtual' ? formData.link : undefined,
        ubicacion: formData.tipo === 'presencial' ? formData.ubicacion : undefined,
        fechaHora: `${formData.fecha}T${formData.hora}`,
        duracion: {
          horas: Number(formData.duracionHoras),
          minutos: Number(formData.duracionMinutos)
        },
        cupos: formData.cupos !== "" ? Number(formData.cupos) : undefined,
        descripcion: formData.descripcion,
        requiereAprobacion: formData.requiereAprobacion
      };

      if (sessionId) {
        await api.put(`/sesiones/${sessionId}`, payload);
        setSuccess("¡Sesión actualizada con éxito!");
      } else {
        await api.post("/sesiones", payload);
        setSuccess("¡Sesión creada con éxito!");
      }
      
      setTimeout(() => {
        navigate("/student/sessions");
      }, 1500);

    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } }; message?: string };
      setError(ax.response?.data?.mensaje || ax.message || "Error al procesar la sesión");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="create-session-container"><p>Cargando datos...</p></div>;

  return (
    <div className="create-session-container">
      <form className="create-session-card" onSubmit={handleSubmit}>
        
        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        <div className="form-group">
          <label htmlFor="materia">Materia *</label>
          <select 
            id="materia"
            name="materia"
            className="select"
            value={formData.materia}
            onChange={handleChange}
            required
            disabled={!!sessionId} // No permitir cambiar materia al editar para evitar inconsistencias
          >
            <option value="">Seleccionar materia</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.nombre} ({s.codigo})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tema">Tema específico *</label>
          <input 
            id="tema"
            name="tema"
            className="input" 
            placeholder="Ej: Repaso para parcial, Resolución TP3" 
            value={formData.tema}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Modalidad *</label>
          <div className="grid-2">
            <div
              className={`modalidad-box ${
                formData.tipo === "presencial" ? "active" : ""
              }`}
              onClick={() => setFormData(prev => ({ ...prev, tipo: "presencial" }))}
            >
              🏢 Presencial
            </div>

            <div
              className={`modalidad-box ${
                formData.tipo === "virtual" ? "active" : ""
              }`}
              onClick={() => setFormData(prev => ({ ...prev, tipo: "virtual" }))}
            >
              💻 Virtual
            </div>
          </div>
        </div>

        {formData.tipo === 'virtual' ? (
          <div className="form-group">
            <label htmlFor="link">Link de videollamada *</label>
            <input 
              id="link"
              name="link"
              className="input" 
              placeholder="Zoom, Meet, Discord, etc." 
              value={formData.link}
              onChange={handleChange}
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="ubicacion">Ubicación *</label>
            <input 
              id="ubicacion"
              name="ubicacion"
              className="input" 
              placeholder="Ej: Aula 305, Biblioteca, Cafetería" 
              value={formData.ubicacion}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div className="grid-2 form-group">
          <div>
            <label htmlFor="fecha">Fecha *</label>
            <input 
              id="fecha"
              name="fecha"
              type="date" 
              className="input" 
              value={formData.fecha}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="hora">Hora *</label>
            <input 
              id="hora"
              name="hora"
              type="time" 
              className="input" 
              value={formData.hora}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Duración estimada *</label>
          <div className="grid-2">
            <div className="flex-center">
              <input 
                name="duracionHoras"
                type="number" 
                min="0"
                max="24"
                className="input" 
                value={formData.duracionHoras}
                onChange={handleChange}
              />
              <span className="ml-2">horas</span>
            </div>
            <div className="flex-center">
              <input 
                name="duracionMinutos"
                type="number" 
                min="0"
                max="59"
                step="15"
                className="input" 
                value={formData.duracionMinutos}
                onChange={handleChange}
              />
              <span className="ml-2">minutos</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cupos">Cupos máximos (opcional)</label>
          <input 
            id="cupos"
            name="cupos"
            type="number" 
            min="1"
            className="input" 
            placeholder="Sin límite" 
            value={formData.cupos}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción / Detalles adicionales</label>
          <textarea 
            id="descripcion"
            name="descripcion"
            className="textarea" 
            placeholder="Comenta qué temas se van a tratar, si hay que llevar algo, etc."
            value={formData.descripcion}
            onChange={handleChange}
          />
        </div>

        <div className="form-group checkbox-group">
          <input 
            id="requiereAprobacion"
            name="requiereAprobacion"
            type="checkbox" 
            checked={formData.requiereAprobacion}
            onChange={handleChange}
          />
          <label htmlFor="requiereAprobacion">Deseo aprobar manualmente a cada participante</label>
        </div>

        <div className="buttons-row">
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => navigate("/student/sessions")}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (sessionId ? "Actualizando..." : "Creando...") : (sessionId ? "Actualizar Sesión" : "Crear Sesión")}
          </button>
        </div>

      </form>
    </div>
  );
}