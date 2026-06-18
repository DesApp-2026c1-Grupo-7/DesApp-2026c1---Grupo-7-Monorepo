import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { nombre: "Usuario", role: "estudiante" };
  const roleLabel = user.role === "admin" ? "Administrador" : "Estudiante";

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

        {user.role !== "admin" && (
          <button
            className="notification-button"
            onClick={() => navigate("/student/notifications")}
            aria-label="Ver notificaciones"
            title="Notificaciones"
          >
            <Bell size={19} />
          </button>
        )}

        <button className="logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
