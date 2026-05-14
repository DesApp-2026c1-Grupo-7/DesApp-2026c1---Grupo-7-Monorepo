import { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/Social.css";

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
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [pendientes, setPendientes] = useState<InvitacionPendiente[]>([]);
  const [enviadas, setEnviadas] = useState<InvitacionEnviada[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contRes, pendRes, envRes] = await Promise.all([
        api.get("/invitaciones/contactos"),
        api.get("/invitaciones/pendientes"),
        api.get("/invitaciones/enviadas")
      ]);
      setContactos(contRes.data);
      setPendientes(pendRes.data);
      setEnviadas(envRes.data);
    } catch (error) {
      console.error("Error al cargar datos sociales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (token: string, action: 'aceptar' | 'rechazar') => {
    try {
      await api.post(`/invitaciones/${action}`, { token });
      // Recargar datos
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || "Error al procesar la invitación");
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("¿Quieres cancelar esta invitación enviada?")) return;
    try {
      await api.delete(`/invitaciones/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || "Error al cancelar la invitación");
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este contacto?")) return;
    try {
      await api.delete(`/invitaciones/contactos/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || "Error al eliminar contacto");
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
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al enviar la invitación", 
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

      {/* Invitación */}
      <div className="card">
        <h3>Invitar Contacto</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          Ingresa el email de un compañero para sumarlo a tus contactos.
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
                  <div>
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
                  <div>
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
                  <button className="btn secondary">Ver Perfil</button>
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