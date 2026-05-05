import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="left">
        {user && <span style={{ fontSize: "0.9rem", color: "#666" }}>Hola, {user.nombre}</span>}
      </div>

      <div className="right">
        <Bell size={20} className="bell" />

        <button className="logout" onClick={handleLogout}>
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;
