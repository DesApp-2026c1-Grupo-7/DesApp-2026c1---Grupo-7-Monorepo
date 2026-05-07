import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirección automática basada en el rol detectado
      navigate(user.role === "admin" ? "/admin" : "/student");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      setError(axiosErr.response?.data?.mensaje || "Error al iniciar sesión");
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

        <form className="login-form" onSubmit={handleLogin}>
          {error && <p className="error-message" style={{ color: 'var(--error)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
          
          <label htmlFor="email">Email</label>
          <input 
            id="email"
            type="email"
            placeholder="usuario@universidad.edu" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input 
            id="password"
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <div className="login-options">
            <label>
              <input type="checkbox" />
              Recordarme
            </label>

            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          <p className="register">
            ¿No tienes cuenta? <a onClick={() => navigate("/register")} style={{cursor: 'pointer'}}>Regístrate aquí</a>
          </p>
        </form>

      </div>
    </div>
  );
};

export default Login;