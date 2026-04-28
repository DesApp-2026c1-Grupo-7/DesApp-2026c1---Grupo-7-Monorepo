import { Bell } from "lucide-react";
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
        <span className="close">✕</span>
      </div>

      <div className="right">
        <Bell size={18} />

        <button className="logout" onClick={handleLogout}>
          ⚙️ Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;