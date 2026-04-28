import { useState } from "react";
import "../../styles/Notifications.css";

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  type: "success" | "info" | "warning" | "default";
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Material aprobado",
      description:
        "Tu material 'Resumen Normalización' fue aprobado y publicado",
      time: "Hace 5 minutos",
      type: "success",
      read: false,
    },
    {
      id: 2,
      title: "Recordatorio de sesión",
      description: "La sesión de Base de Datos comienza en 2 horas",
      time: "Hace 1 hora",
      type: "info",
      read: false,
    },
    {
      id: 3,
      title: "Nueva solicitud de conexión",
      description: "Pedro Martínez quiere conectar contigo",
      time: "Hace 3 horas",
      type: "info",
      read: false,
    },
    {
      id: 4,
      title: "Nuevo participante",
      description: "María González se unió a tu sesión de estudio",
      time: "Hace 5 horas",
      type: "default",
      read: true,
    },
    {
      id: 5,
      title: "Nuevo material disponible",
      description:
        "Ana López compartió 'Ejercicios SQL' en Base de Datos",
      time: "Hace 1 día",
      type: "default",
      read: true,
    },
    {
      id: 6,
      title: "Sesión cancelada",
      description:
        "La sesión de Redes del 15/05 fue cancelada por el organizador",
      time: "Hace 2 días",
      type: "warning",
      read: true,
    },
  ]);

  const marcarComoLeida = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const marcarTodas = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const sinLeer = notifications.filter((n) => !n.read);
  const leidas = notifications.filter((n) => n.read);

  return (
    <div className="notifications-container">
      {/* HEADER */}
      <div className="notifications-header">
        <div>
          <h2>Notificaciones</h2>
          <p>Mantente al día con tus actividades</p>
        </div>

        <button className="link-btn" onClick={marcarTodas}>
          Marcar todas como leídas
        </button>
      </div>

      {/* SIN LEER */}
      <h4 className="section-title">Sin leer</h4>

      {sinLeer.map((n) => (
        <div key={n.id} className={`notification-card ${n.type}`}>
          <div className="left">
            <div className="icon">
              {n.type === "success" && "✔"}
              {n.type === "info" && "📅"}
              {n.type === "warning" && "⚠"}
            </div>

            <div>
              <h4>{n.title}</h4>
              <p>{n.description}</p>
              <span>{n.time}</span>
            </div>
          </div>

          <button
            className="link-btn"
            onClick={() => marcarComoLeida(n.id)}
          >
            Marcar como leída
          </button>
        </div>
      ))}

      {/* LEÍDAS */}
      <h4 className="section-title">Anteriores</h4>

      {leidas.map((n) => (
        <div key={n.id} className="notification-card read">
          <div className="left">
            <div className="icon">📄</div>

            <div>
              <h4>{n.title}</h4>
              <p>{n.description}</p>
              <span>{n.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}