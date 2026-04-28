import { useNavigate } from "react-router-dom";
import "../../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <div className="icon">🎓</div>
          <h1>Bienvenido</h1>
          <p>Sistema de Acompañamiento Académico</p>
        </div>

        <div className="login-form">
          <label>Email</label>
          <input placeholder="estudiante@universidad.edu" />

          <label>Contraseña</label>
          <input type="password" placeholder="••••••••" />

          <div className="login-options">
            <label>
              <input type="checkbox" />
              Recordarme
            </label>

            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button
            className="btn primary"
            onClick={() => navigate("/student")}
          >
            Ingresar como Estudiante
          </button>

          <button
            className="btn secondary"
            onClick={() => navigate("/admin")}
          >
            Ingresar como Administrador
          </button>

          <p className="register">
            ¿No tienes cuenta? <a href="#">Regístrate aquí</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;