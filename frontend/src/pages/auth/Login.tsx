import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginService } from "../../services/auth.service";
import "../../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Email y contraseña son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const res = await loginService(email, password);
      setAuth(res.token, res.user);
      navigate(res.user.role === "admin" ? "/admin" : "/student");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="icon">🎓</div>
          <h1>Bienvenido</h1>
          <p>Sistema de Acompañamiento Académico</p>
        </div>

        <div className="login-form">
          {error && <p style={{ color: "#e74c3c", fontSize: "0.9rem", margin: "0 0 1rem" }}>{error}</p>}

          <label>Email</label>
          <input
            placeholder="estudiante@universidad.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <div className="login-options">
            <label>
              <input type="checkbox" />
              Recordarme
            </label>
          </div>

          <button
            className="btn primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <p className="register">
            ¿No tienes cuenta?{" "}
            <a onClick={() => navigate("/register")} style={{ cursor: "pointer" }}>
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
