import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Auth.css";

interface Career {
  _id: string;
  nombre: string;
}

// Onboarding para cuentas sin carrera (típicamente las creadas con Google).
// Elegís la carrera y el backend deriva el plan de estudios activo.
const Onboarding = () => {
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [carrera, setCarrera] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/carreras")
      .then((response) => {
        setCareers(response.data);
        if (response.data.length > 0) setCarrera(response.data[0]._id);
      })
      .catch(() => setError("No se pudieron cargar las carreras"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrera) {
      setError("Elegí una carrera para continuar");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.put("/perfil/me/carrera", { carrera });
      const user = response.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/student", { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      setError(axiosErr.response?.data?.mensaje || "No se pudo guardar la carrera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="icon">🎓</div>
          <h1>¡Bienvenido/a!</h1>
          <p>Antes de empezar, contanos qué carrera estás cursando</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <p className="error-message" style={{ color: "var(--error)", fontSize: "0.875rem", textAlign: "center" }}>
              {error}
            </p>
          )}

          <label htmlFor="carrera">Carrera</label>
          <select
            id="carrera"
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            disabled={loading || careers.length === 0}
            required
          >
            {careers.map((career) => (
              <option key={career._id} value={career._id}>{career.nombre}</option>
            ))}
          </select>

          <button type="submit" className="btn primary" disabled={loading || careers.length === 0}>
            {loading ? "Guardando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
