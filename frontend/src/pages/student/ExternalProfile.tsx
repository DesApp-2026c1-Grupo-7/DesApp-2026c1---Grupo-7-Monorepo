import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Profile.css"; // Reuse profile styles
import "../../styles/Situation.css"; // Reuse situation styles for the table

interface AcademicRecord {
  _id: string;
  materia: {
    nombre: string;
    anio: number;
  };
  estado: string;
  nota?: number;
  fecha: string;
}

interface PublicProfile {
  _id: string;
  nombre: string;
  email?: string;
  bio?: string;
  foto?: string;
  carrera?: { nombre: string };
  configuracionPrivacidad: {
    perfil: 'publico' | 'privado';
    mostrarEmail: boolean;
    mostrarSituacionAcademica: boolean;
  };
  situacionAcademica?: AcademicRecord[];
  esContacto: boolean;
  invitacionPendiente?: {
    _id: string;
    remitente: string;
    token: string;
  } | null;
}

const ExternalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get(`/perfil/${id}`);
      setProfile(response.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { mensaje?: string } } };
      if (axiosErr.response?.status === 403) {
        setError("Este perfil es privado. Solo sus contactos pueden verlo.");
      } else if (axiosErr.response?.status === 404) {
        setError("Usuario no encontrado.");
      } else {
        setError("Error al cargar el perfil.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const handleInvite = async () => {
    if (!profile?.email) return;
    setProcessing(true);
    try {
      await api.post("/invitaciones/enviar", { email: profile.email });
      await fetchProfile(); // Recargar para actualizar estado
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      alert(axiosErr.response?.data?.mensaje || "Error al enviar invitación");
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!profile?.invitacionPendiente?.token) return;
    setProcessing(true);
    try {
      await api.post("/invitaciones/aceptar", { token: profile.invitacionPendiente.token });
      await fetchProfile();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      alert(axiosErr.response?.data?.mensaje || "Error al aceptar invitación");
    } finally {
      setProcessing(false);
    }
  };

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case "Aprobada": return "badge green";
      case "Regular": return "badge blue";
      case "Cursando": return "badge yellow";
      case "Pendiente": return "badge gray";
      default: return "badge";
    }
  };

  if (loading) return <div className="profile-container"><p>Cargando perfil...</p></div>;

  if (error) {
    return (
      <div className="profile-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
          <h2>{error}</h2>
          <button className="btn secondary" onClick={() => navigate(-1)} style={{ marginTop: '20px' }}>
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const renderActions = () => {
    if (profile.esContacto) {
      return <span className="badge green" style={{ padding: '8px 16px' }}>Es tu contacto</span>;
    }

    if (profile.invitacionPendiente) {
      if (profile.invitacionPendiente.remitente === currentUser.id) {
        return <span className="badge blue" style={{ padding: '8px 16px' }}>Invitación enviada</span>;
      } else {
        return (
          <button 
            className="btn primary" 
            onClick={handleAccept} 
            disabled={processing}
          >
            {processing ? "Procesando..." : "Aceptar solicitud de contacto"}
          </button>
        );
      }
    }

    return (
      <button 
        className="btn primary" 
        onClick={handleInvite} 
        disabled={processing}
      >
        {processing ? "Enviando..." : "Sumar a mis contactos"}
      </button>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-header card">
        <div className="profile-info-main">
          <div className="profile-avatar-container">
            {profile.foto ? (
              <img src={profile.foto} alt={profile.nombre} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                👤
              </div>
            )}
          </div>
          <div className="profile-text">
            <h1>{profile.nombre}</h1>
            <p className="profile-career">{profile.carrera?.nombre || "Estudiante"}</p>
            {profile.email && <p className="profile-email">{profile.email}</p>}
          </div>
        </div>

        <div className="profile-actions">
          {renderActions()}
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-section card">
          <h3>Sobre mí</h3>
          <p className="bio-text">
            {profile.bio || "Este usuario aún no ha escrito una biografía."}
          </p>
        </div>

        {profile.situacionAcademica && (
          <div className="profile-section card" style={{ gridColumn: '1 / -1' }}>
            <h3>Situación Académica</h3>
            <div className="table-container" style={{ marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Año</th>
                    <th>Estado</th>
                    <th>Nota</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.situacionAcademica.length > 0 ? (
                    profile.situacionAcademica.map((m) => (
                      <tr key={m._id}>
                        <td>{m.materia.nombre}</td>
                        <td>{m.materia.anio}°</td>
                        <td><span className={getBadgeClass(m.estado)}>{m.estado}</span></td>
                        <td>{m.nota || "-"}</td>
                        <td>{new Date(m.fecha).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No hay registros académicos visibles.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalProfile;