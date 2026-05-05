import { Bell, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { nombre: "Usuario", role: "estudiante" };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="left">
        <Menu size={20} className="close" />
        <span style={{ marginLeft: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {user.role === 'admin' ? 'Panel de Administración' : 'Panel del Estudiante'}
        </span>
      </div>

      <div className="right">
        <div className="user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '1rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.nombre}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</span>
        </div>
        
        <Bell size={20} className="bell" />

        <button className="logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;