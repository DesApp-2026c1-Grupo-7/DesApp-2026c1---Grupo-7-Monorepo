import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Validar campos vacíos
    if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    // 2. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, ingresa un email válido");
      return;
    }

    // 3. Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", { 
        nombre, 
        email, 
        password,
        role: 'student' // Default to student on public register
      });
      
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/student");
    } catch (err: any) {
      setError(err.response?.data?.mensaje || "Error al registrarse");
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

        <form className="login-form" onSubmit={handleRegister}>
          {error && <p className="error-message" style={{ color: 'var(--error)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

          <label htmlFor="nombre">Nombre Completo</label>
          <input 
            id="nombre"
            placeholder="Juan Pérez" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={loading}
            required
          />

          <label htmlFor="email">Email</label>
          <input 
            id="email"
            type="email"
            placeholder="estudiante@universidad.edu" 
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

          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
          <input 
            id="confirmPassword"
            type="password" 
            placeholder="••••••••" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          <p className="register">
            ¿Ya tienes cuenta? <a onClick={() => navigate("/")} style={{cursor: 'pointer'}}>Inicia sesión aquí</a>
          </p>
        </form>

      </div>
    </div>
  );
};

export default Register;

