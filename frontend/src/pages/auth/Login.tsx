import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { ShieldCheck } from "lucide-react";
import api from "../../services/api";
import "../../styles/Auth.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from || null;

  // Guarda la sesión y redirige según el rol (compartido por login local y Google).
  const finalizarSesion = (token: string, user: { role: string; carrera?: unknown }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    // Estudiante sin carrera (típico de cuentas nuevas de Google): completar onboarding.
    if (user.role === "student" && !user.carrera) {
      navigate("/onboarding", { replace: true });
      return;
    }
    if (from) {
      navigate(from, { replace: true });
    } else {
      navigate(user.role === "admin" ? "/admin" : "/student");
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      finalizarSesion(response.data.token, response.data.user);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      setError(axiosErr.response?.data?.mensaje || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse: CredentialResponse) => {
    setError("");
    try {
      const response = await api.post("/auth/google", { credential: credentialResponse.credential });
      finalizarSesion(response.data.token, response.data.user);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      setError(axiosErr.response?.data?.mensaje || "No se pudo iniciar sesión con Google");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <img src="/unahur-logo.svg" alt="UNAHUR - Universidad Nacional de Hurlingham" className="unahur-logo" />
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
            <span><ShieldCheck size={15} /> Acceso seguro institucional</span>
          </div>

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="login-divider"><span>o</span></div>
              <div className="google-login-wrapper">
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={handleGoogle}
                    onError={() => setError("No se pudo iniciar sesión con Google")}
                    text="signin_with"
                  />
                </GoogleOAuthProvider>
              </div>
            </>
          )}

          <p className="register">
            ¿No tienes cuenta? <button type="button" className="auth-link" onClick={() => navigate("/register")}>Regístrate aquí</button>
          </p>
        </form>

      </div>
    </div>
  );
};

export default Login;
