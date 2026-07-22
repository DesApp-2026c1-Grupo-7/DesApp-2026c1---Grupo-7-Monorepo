import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import "../../styles/Notifications.css";

interface Notification {
  _id: string;
  titulo: string;
  descripcion: string;
  createdAt: string;
  tipo: "success" | "info" | "warning" | "default";
  leida: boolean;
  link?: string;
}

const PAGE_SIZE = 10;

type Orden = "nuevas" | "antiguas";
type Filtro = "todas" | "leidas" | "noleidas" | "materias" | "sesiones" | "contactos";

// Deriva categoria de una notificacion a partir de link/titulo/descripcion.
function categoria(n: Notification): "materias" | "sesiones" | "contactos" | "otras" {
  const s = `${n.link || ""} ${n.titulo} ${n.descripcion}`.toLowerCase();
  if (s.includes("sesion") || s.includes("sessions") || s.includes("session")) return "sesiones";
  if (s.includes("contacto") || s.includes("invitacion") || s.includes("perfil") || s.includes("social")) return "contactos";
  if (s.includes("materia") || s.includes("regular") || s.includes("final") || s.includes("nota") || s.includes("correlativ")) return "materias";
  return "otras";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibles, setVisibles] = useState(PAGE_SIZE);
  const [orden, setOrden] = useState<Orden>("nuevas");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const loadNotifications = useCallback(() => {
    api.get("/notificaciones")
      .then((response) => setNotifications(response.data))
      .catch((error) => console.error("Error al cargar notificaciones:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    setVisibles(PAGE_SIZE);
  }, [orden, filtro]);

  const marcarComoLeida = async (id: string) => {
    try {
      await api.put(`/notificaciones/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, leida: true } : n))
      );
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const marcarTodas = async () => {
    try {
      await api.put("/notificaciones/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (error) {
      console.error("Error al marcar todas:", error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `Hace ${minutes} minutos`;
    if (hours < 24) return `Hace ${hours} horas`;
    return `Hace ${days} días`;
  };

  const noLeidasTotal = notifications.filter((n) => !n.leida).length;

  const filtradas = notifications.filter((n) => {
    if (filtro === "todas") return true;
    if (filtro === "leidas") return n.leida;
    if (filtro === "noleidas") return !n.leida;
    return categoria(n) === filtro;
  });

  const ordenadas = [...filtradas].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return orden === "nuevas" ? tb - ta : ta - tb;
  });

  const paginar = filtro === "todas";
  const mostradas = paginar ? ordenadas.slice(0, visibles) : ordenadas;
  const sinLeer = mostradas.filter((n) => !n.leida);
  const leidas = mostradas.filter((n) => n.leida);
  const hayMas = paginar && visibles < ordenadas.length;

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: 'white',
    fontSize: 14,
    color: '#111827',
    cursor: 'pointer'
  };

  return (
    <div className="notifications-container">
      {/* HEADER */}
      <div className="notifications-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Notificaciones
            <span style={{ padding: '2px 10px', borderRadius: 999, background: '#dbeafe', color: '#1e40af', fontSize: 13, fontWeight: 500 }}>
              Total: {noLeidasTotal} notificaciones
            </span>
          </h2>
          <p>Mantente al día con tus actividades</p>
        </div>

        {noLeidasTotal > 0 && (
          <button className="link-btn" onClick={marcarTodas}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0 16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          Ordenar por:
          <select style={selectStyle} value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
            <option value="nuevas">Más nuevas</option>
            <option value="antiguas">Más antiguas</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          Filtrar por:
          <select style={selectStyle} value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
            <option value="todas">Todas</option>
            <option value="leidas">Leídas</option>
            <option value="noleidas">No leídas</option>
            <option value="materias">Materias</option>
            <option value="sesiones">Sesiones</option>
            <option value="contactos">Contactos</option>
          </select>
        </label>
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No tienes notificaciones por el momento.</p>
        </div>
      ) : ordenadas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No hay notificaciones que coincidan con el filtro seleccionado.</p>
        </div>
      ) : (
        <>
          {/* NO LEÍDAS */}
          {sinLeer.length > 0 && (
            <>
              <h4 className="section-title">No leídas</h4>
              {sinLeer.map((n) => (
                <div key={n._id} className={`notification-card ${n.tipo}`}>
                  <div className="left">
                    <div className="icon">
                      {n.tipo === "success" && "✔"}
                      {n.tipo === "info" && "📅"}
                      {n.tipo === "warning" && "⚠"}
                      {n.tipo === "default" && "🔔"}
                    </div>

                    <div>
                      <h4>{n.titulo}</h4>
                      <p>{n.descripcion}</p>
                      <span>{formatTime(n.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    className="link-btn"
                    onClick={() => marcarComoLeida(n._id)}
                  >
                    Marcar como leída
                  </button>
                </div>
              ))}
            </>
          )}

          {/* LEÍDAS */}
          {leidas.length > 0 && (
            <>
              <h4 className="section-title">Leídas</h4>
              {leidas.map((n) => (
                <div key={n._id} className="notification-card read">
                  <div className="left">
                    <div className="icon">
                      {n.tipo === "success" ? "✅" : "📄"}
                    </div>

                    <div>
                      <h4>{n.titulo}</h4>
                      <p>{n.descripcion}</p>
                      <span>{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {hayMas && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                className="btn primary"
                onClick={() => setVisibles((v) => v + PAGE_SIZE)}
              >
                Ver más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
