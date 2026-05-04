import { useNavigate } from "react-router-dom";
import "../../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <div className="icon">📝</div>
          <h1>Crear Cuenta</h1>
          <p>Únete al Sistema de Acompañamiento Académico</p>
        </div>

        <div className="login-form">
          <label>Nombre Completo</label>
          <input placeholder="Juan Pérez" />

          <label>Email</label>
          <input placeholder="estudiante@universidad.edu" />

          <label>Contraseña</label>
          <input type="password" placeholder="••••••••" />

          <label>Confirmar Contraseña</label>
          <input type="password" placeholder="••••••••" />

          <button
            className="btn primary"
            onClick={() => navigate("/student")}
          >
            Registrarse
          </button>

          <p className="register">
            ¿Ya tienes cuenta? <a onClick={() => navigate("/")} style={{cursor: 'pointer'}}>Inicia sesión aquí</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
