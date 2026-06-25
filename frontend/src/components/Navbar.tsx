import { Bell, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useUnreadNotifications, refreshUnread } from "../hooks/useUnreadNotifications";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { nombre: "Usuario", role: "estudiante" };
  const roleLabel = user.role === "admin" ? "Administrador" : "Estudiante";
  const isStudent = user.role !== "admin";

  const unread = useUnreadNotifications(isStudent);

  // Al cambiar de pantalla refrescamos el contador (ej. al volver de Notificaciones
  // tras marcarlas como leidas, para que baje enseguida).
  useEffect(() => {
    if (isStudent) refreshUnread();
  }, [location.pathname, isStudent]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="left">
        <span className="navbar-context">
          {user.role === 'admin' ? 'Gestión institucional' : 'Mi espacio académico'}
        </span>
      </div>

      <div className="right">
        <div className="user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '1rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.nombre}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleLabel}</span>
        </div>

        {isStudent && (
          <button
            className="notification-button"
            onClick={() => navigate("/student/notifications")}
            aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Ver notificaciones"}
            title="Notificaciones"
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="notification-badge" aria-hidden="true">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        )}

        <button className="logout" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
