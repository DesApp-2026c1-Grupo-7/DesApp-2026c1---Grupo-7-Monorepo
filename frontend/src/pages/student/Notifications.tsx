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

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    api.get("/notificaciones")
      .then((response) => {
        setNotifications(response.data);
      })
      .catch((error) => {
        console.error("Error al cargar notificaciones:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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

  const sinLeer = notifications.filter((n) => !n.leida);
  const leidas = notifications.filter((n) => n.leida);

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      {/* HEADER */}
      <div className="notifications-header">
        <div>
          <h2>Notificaciones</h2>
          <p>Mantente al día con tus actividades</p>
        </div>

        {sinLeer.length > 0 && (
          <button className="link-btn" onClick={marcarTodas}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No tienes notificaciones por el momento.</p>
        </div>
      ) : (
        <>
          {/* SIN LEER */}
          {sinLeer.length > 0 && (
            <>
              <h4 className="section-title">Nuevas</h4>
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
              <h4 className="section-title">Anteriores</h4>
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
        </>
      )}
    </div>
  );
}