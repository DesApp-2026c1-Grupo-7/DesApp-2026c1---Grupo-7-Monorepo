import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Social.css";

interface SearchResult {
  _id: string;
  nombre: string;
  foto?: string;
  carrera?: { nombre: string };
  configuracionPrivacidad: { perfil: 'publico' | 'privado' };
}

interface Contacto {
  _id: string;
  nombre: string;
  email: string;
  foto?: string;
  carrera?: { nombre: string };
}

interface InvitacionPendiente {
  _id: string;
  remitente: {
    _id: string;
    nombre: string;
    foto?: string;
    carrera?: { nombre: string };
  };
  token: string;
}

interface InvitacionEnviada {
  _id: string;
  destinatario: {
    _id: string;
    nombre: string;
    email: string;
    foto?: string;
    carrera?: { nombre: string };
  };
  createdAt: string;
}

const Social = () => {
  const navigate = useNavigate();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [pendientes, setPendientes] = useState<InvitacionPendiente[]>([]);
  const [enviadas, setEnviadas] = useState<InvitacionEnviada[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([
      api.get("/invitaciones/contactos"),
      api.get("/invitaciones/pendientes"),
      api.get("/invitaciones/enviadas")
    ])
      .then(([contRes, pendRes, envRes]) => {
        setContactos(contRes.data);
        setPendientes(pendRes.data);
        setEnviadas(envRes.data);
      })
      .catch((error) => {
        console.error("Error al cargar datos sociales:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        setSearchError(false);
        api.get(`/perfil/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => {
            setSearchResults(res.data);
            setShowDropdown(true);
          })
          .catch(err => {
            console.error("Error en búsqueda:", err);
            setSearchError(true);
            setSearchResults([]);
          })
          .finally(() => setSearching(false));
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAction = async (token: string, action: 'aceptar' | 'rechazar') => {
    try {
      await api.post(`/invitaciones/${action}`, { token });
      // Recargar datos
      loadData();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { mensaje?: string } } };
      alert(axiosErr.response?.data?.mensaje || "Error al procesar la invitación");
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("¿Quieres cancelar esta invitación enviada?")) return;
    try {
      await api.delete(`/invitaciones/${id}`);
      loadData();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { mensaje?: string } } };
      alert(axiosErr.response?.data?.mensaje || "Error al cancelar la invitación");
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este contacto?")) return;
    try {
      await api.delete(`/invitaciones/contactos/${id}`);
      loadData();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { mensaje?: string } } };
      alert(axiosErr.response?.data?.mensaje || "Error al eliminar contacto");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setMessage(null);
    try {
      const response = await api.post("/invitaciones/enviar", { email: inviteEmail });
      setMessage({ text: response.data.mensaje, type: "success" });
      setInviteEmail("");
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { mensaje?: string } } };
      setMessage({ 
        text: axiosErr.response?.data?.mensaje || "Error al enviar la invitación", 
        type: "error" 
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="social-container">
      <h1>Red Social</h1>
      <p className="subtitle">Conecta con otros estudiantes y amplía tu red académica</p>

      {/* Buscador de Usuarios */}
      <div className="card search-users-card" style={{ position: 'relative', zIndex: 100 }}>
        <h3>Buscar un Perfil</h3>
        <div className="search-bar-container" style={{ position: 'relative', marginTop: '1rem' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                navigate(`/student/perfil/${searchResults[0]._id}`);
              }
            }}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          />
          {searching && <div className="searching-spinner" style={{ position: 'absolute', right: '15px', top: '12px' }}>⏳</div>}
          
          {showDropdown && (
            <div className="search-results-dropdown" style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              backgroundColor: 'white', 
              border: '1px solid #ccc', 
              borderRadius: '0 0 8px 8px', 
              zIndex: 1000,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              marginTop: '4px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div 
                    key={user._id} 
                    className="search-result-item" 
                    onMouseDown={() => {
                      // Usamos onMouseDown para que se ejecute antes del onBlur si lo tuviéramos
                      navigate(`/student/perfil/${user._id}`);
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '12px', 
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <div className="avatar" style={{ width: '35px', height: '35px' }}>
                      {user.foto ? <img src={user.foto} alt={user.nombre} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} /> : "👤"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{user.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.carrera?.nombre || "Estudiante"}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      {user.configuracionPrivacidad.perfil === 'privado' ? "🔒 Privado" : "🌐 Público"}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  {searchError ? "Error al realizar la búsqueda" : "No se encontraron perfiles"}
                </div>
              )}
            </div>
          )}
        </div>
        {showDropdown && (
          <div 
            className="dropdown-overlay" 
            onClick={() => setShowDropdown(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
          />
        )}
      </div>

      {/* Invitación */}
      <div className="card">
        <h3>Invitar por Email</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          ¿Tu compañero no aparece en la búsqueda? Invitalo directamente por email.
        </p>
        <form onSubmit={handleInvite} className="invite-form" style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="email" 
            placeholder="email@ejemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd' 
            }}
            required
          />
          <button type="submit" className="btn primary" disabled={inviting}>
            {inviting ? "Enviando..." : "Enviar Invitación"}
          </button>
        </form>
        {message && (
          <div className={`profile-alert ${message.type}`} style={{ marginTop: '1rem', padding: '10px' }}>
            {message.text}
          </div>
        )}
      </div>

      {/* Invitaciones Pendientes */}
      {pendientes.length > 0 && (
        <div className="card">
          <h3>Solicitudes de Contacto ({pendientes.length})</h3>
          <div className="pending-list">
            {pendientes.map((inv) => (
              <div key={inv._id} className="request-item">
                <div className="user-info">
                  <div className="avatar">
                    {inv.remitente.foto ? <img src={inv.remitente.foto} alt={inv.remitente.nombre} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} /> : "👤"}
                  </div>
                  <div onClick={() => navigate(`/student/perfil/${inv.remitente._id}`)} style={{ cursor: 'pointer' }}>
                    <strong>{inv.remitente.nombre}</strong>
                    <p>{inv.remitente.carrera?.nombre || "Estudiante"}</p>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn primary" onClick={() => handleAction(inv.token, 'aceptar')}>Aceptar</button>
                  <button className="btn secondary" onClick={() => handleAction(inv.token, 'rechazar')}>Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitaciones Enviadas */}
      {enviadas.length > 0 && (
        <div className="card">
          <h3>Invitaciones Enviadas ({enviadas.length})</h3>
          <div className="pending-list">
            {enviadas.map((inv) => (
              <div key={inv._id} className="request-item">
                <div className="user-info">
                  <div className="avatar">
                    {inv.destinatario.foto ? <img src={inv.destinatario.foto} alt={inv.destinatario.nombre} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} /> : "👤"}
                  </div>
                  <div onClick={() => navigate(`/student/perfil/${inv.destinatario._id}`)} style={{ cursor: 'pointer' }}>
                    <strong>{inv.destinatario.nombre}</strong>
                    <p>{inv.destinatario.carrera?.nombre || "Estudiante"}</p>
                    <span style={{ fontSize: '0.8rem' }}>Pendiente de respuesta</span>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn secondary" onClick={() => handleCancel(inv._id)}>Cancelar Invitación</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mis Contactos */}
      <div className="card">
        <h3>Mis Contactos ({contactos.length})</h3>
        
        {loading ? (
          <p>Cargando contactos...</p>
        ) : contactos.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>
            Aún no tienes contactos. ¡Invita a tus compañeros!
          </p>
        ) : (
          <div className="contacts-list">
            {contactos.map((contacto) => (
              <div key={contacto._id} className="request-item">
                <div className="user-info">
                  <div className="avatar">
                    {contacto.foto ? <img src={contacto.foto} alt={contacto.nombre} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} /> : "👤"}
                  </div>
                  <div>
                    <strong>{contacto.nombre}</strong>
                    <p>{contacto.carrera?.nombre || "Estudiante"}</p>
                    <span style={{ fontSize: '0.8rem' }}>{contacto.email}</span>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn secondary" onClick={() => navigate(`/student/perfil/${contacto._id}`)}>Ver Perfil</button>
                  <button className="btn secondary" style={{ color: 'var(--error)' }} onClick={() => handleRemove(contacto._id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post box (Placeholder) */}
      <div className="card post-box">
        <div className="post-input">
          <div className="avatar" />
          <textarea placeholder="¿Qué estás pensando?" />
        </div>
        <div className="post-actions">
          <button className="btn primary">Publicar</button>
        </div>
      </div>
    </div>
  );
};

export default Social;