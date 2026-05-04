import { Bell, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="left">
        <Menu size={20} className="close" />
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