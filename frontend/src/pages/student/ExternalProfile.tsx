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
  } | null;
}


const ExternalProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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
    (async () => {
      await fetchProfile();
    })();
  }, [fetchProfile]);

  const handleInvite = async () => {
    if (!profile) return;
    setProcessing(true);
    setMessage(null);
    try {
      // Usamos destinatarioId para que funcione aunque el email esté oculto
      const response = await api.post("/invitaciones/enviar", { destinatarioId: profile._id });
      setMessage({ text: response.data.mensaje || "Invitación enviada con éxito", type: "success" });
      await fetchProfile(); // Recargar para actualizar estado
      setTimeout(() => setMessage(null), 4000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      setMessage({ 
        text: axiosErr.response?.data?.mensaje || "Error al enviar invitación", 
        type: "error" 
      });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!profile?.invitacionPendiente?._id) return;
    setProcessing(true);
    setMessage(null);
    try {
      // Usamos invitacionId en lugar del token por seguridad y simplicidad
      const response = await api.post("/invitaciones/aceptar", { invitacionId: profile.invitacionPendiente._id });
      setMessage({ text: response.data.mensaje || "Invitación aceptada", type: "success" });
      await fetchProfile();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      setMessage({ 
        text: axiosErr.response?.data?.mensaje || "Error al aceptar invitación", 
        type: "error" 
      });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setProcessing(false);
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
      {message && (
        <div className={`profile-alert ${message.type}`}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          {message.text}
        </div>
      )}
      <h1>Perfil del Estudiante</h1>
      <p className="subtitle">Conoce más sobre tus compañeros y su camino académico</p>

      <div className="card profile-header-card">
        <div className="avatar-wrapper">
          <div className="avatar-main">
            {profile.foto ? (
              <img src={profile.foto} alt={profile.nombre} />
            ) : (
              "👤"
            )}
          </div>
        </div>

        <div className="user-info-main">
          <h2>{profile.nombre}</h2>
          <span className="role-badge">
            {profile.carrera?.nombre || "Estudiante"}
          </span>

          <div className="user-meta-grid" style={{ justifyContent: 'center', textAlign: 'center' }}>
            {profile.email && (
              <div className="meta-item">
                <label>Email</label>
                <span>{profile.email}</span>
              </div>
            )}
            <div className="meta-item">
              <label>Estado</label>
              <span>{profile.esContacto ? "En tus contactos" : "No es contacto"}</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            {renderActions()}
          </div>
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
            <div className="privacy-header">
              <span>🎓</span>
              <h3>Situación Académica</h3>
            </div>
            <div className="academic-grid" style={{ marginTop: '1rem' }}>
              {profile.situacionAcademica.length > 0 ? (
                profile.situacionAcademica.map((m) => (
                  <div key={m._id} className="academic-item">
                    <div className="academic-info">
                      <span className="subject-name">{m.materia.nombre}</span>
                      <span className="subject-year">
                        {m.materia.anio === undefined ? "Año no especificado" : 
                         m.materia.anio === 0 ? "Materia Transversal" : 
                         `${m.materia.anio}° Año`}
                      </span>
                    </div>
                    <div className="academic-status">
                      <span className={`status-badge ${m.estado.toLowerCase()}`}>
                        {m.estado}
                      </span>
                      {m.nota && <span className="grade-badge">{m.nota}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '20px', color: 'var(--text-muted)' }}>
                  No hay registros académicos visibles.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalProfile;