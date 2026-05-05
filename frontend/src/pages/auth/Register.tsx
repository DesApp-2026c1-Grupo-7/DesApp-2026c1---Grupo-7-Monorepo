import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerService } from "../../services/auth.service";
import "../../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");

    if (!nombre || !email || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await registerService(nombre, email, password);
      setAuth(res.token, res.user);
      navigate("/student");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="icon">📝</div>
          <h1>Crear Cuenta</h1>
          <p>Únete al Sistema de Acompañamiento Académico</p>
        </div>

        <div className="login-form">
          {error && <p style={{ color: "#e74c3c", fontSize: "0.9rem", margin: "0 0 1rem" }}>{error}</p>}

          <label>Nombre Completo</label>
          <input
            placeholder="Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <label>Email</label>
          <input
            placeholder="estudiante@universidad.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Confirmar Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />

          <button
            className="btn primary"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          <p className="register">
            ¿Ya tienes cuenta?{" "}
            <a onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
