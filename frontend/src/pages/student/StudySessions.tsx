import { useEffect, useState, useMemo } from "react";
import "../../styles/StudySessions.css";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Session {
  _id: string;
  materia: {
    nombre: string;
    codigo: string;
  } | null;
  creador: {
    _id: string;
    nombre: string;
    foto?: string;
  } | null;
  tema: string;
  tipo: "virtual" | "presencial";
  link?: string;
  ubicacion?: string;
  fechaHora: string;
  duracion: {
    horas: number;
    minutos: number;
  };
  cupos?: number;
  participantes: string[];
  solicitudes: { usuario: string | { _id: string; nombre: string }; estado: string }[];
  requiereAprobacion: boolean;
  descripcion?: string;
}

const StudySessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState("all");

  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  const fetchSessions = async (isMounted: boolean) => {
    try {
      const res = await api.get("/sesiones");
      if (isMounted) {
        setSessions(res.data);
      }
    } catch {
      if (isMounted) {
        setError("No se pudieron cargar las sesiones de estudio");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchSessions(isMounted);
    return () => { isMounted = false; };
  }, []);

  const handleJoin = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const res = await api.post(`/sesiones/${sessionId}/join`);
      alert(res.data.mensaje);
      fetchSessions(true);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "Error al unirse a la sesión");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageRequest = async (sessionId: string, userId: string, action: 'approve' | 'reject') => {
    setActionLoading(`${sessionId}-${userId}`);
    try {
      const res = await api.post(`/sesiones/manage-request`, { sessionId, userId, action });
      alert(res.data.mensaje);
      fetchSessions(true);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "Error al gestionar la solicitud");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (sessionId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres darte de baja de esta sesión?")) return;
    setActionLoading(sessionId);
    try {
      const res = await api.post(`/sesiones/${sessionId}/leave`);
      alert(res.data.mensaje);
      fetchSessions(true);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "Error al darse de baja");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (sessionId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta sesión? Se notificará a todos los participantes.")) return;
    setActionLoading(sessionId);
    try {
      const res = await api.delete(`/sesiones/${sessionId}`);
      alert(res.data.mensaje);
      fetchSessions(true);
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "Error al cancelar la sesión");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Filtro por materia
      if (searchQuery) {
        if (!s.materia) return false;
        if (!s.materia.nombre.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // 2. Filtro por modalidad / creador
      if (modalityFilter === "mine") {
        if (s.creador?._id !== currentUser?.id) return false;
      } else if (modalityFilter !== "all" && s.tipo !== modalityFilter) {
        return false;
      }

      // 3. Filtro por fecha específica
      if (dateFilter) {
        const d = new Date(s.fechaHora);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const sessionDateLocal = `${year}-${month}-${day}`;
        
        if (sessionDateLocal !== dateFilter) return false;
      }

      // 4. Filtro por cupos disponibles
      if (onlyAvailable === "available") {
        // Si no tiene límite de cupos (cupos es undefined o null), siempre está disponible
        if (s.cupos && s.participantes.length >= s.cupos) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, searchQuery, modalityFilter, dateFilter, onlyAvailable]);

  const formatFecha = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatHora = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + 'hs';
  };

  if (loading) return <div className="sessions-container"><p>Cargando sesiones...</p></div>;

  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <div>
          <h2>Sesiones de Estudio</h2>
          <p>Encuentra o crea grupos de estudio para tus materias</p>
        </div>

        <button 
          onClick={() => navigate("/student/create-session")}
          className="btn-primary"
        >
          + Crear Sesión
        </button>
      </div>

      {error && <div className="error-alert" style={{ marginBottom: 20 }}>{error}</div>}

      {/* FILTROS */}
      <div className="sessions-filters">
        <input 
          placeholder="Buscar materia..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select 
          value={modalityFilter} 
          onChange={(e) => setModalityFilter(e.target.value)}
        >
          <option value="all">Todas las modalidades</option>
          <option value="presencial">Presencial</option>
          <option value="virtual">Virtual</option>
          <option value="mine">Mis sesiones creadas</option>
        </select>

        <input 
          type="date" 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="date-filter-input"
          title="Filtrar por fecha"
        />

        <select
          value={onlyAvailable}
          onChange={(e) => setOnlyAvailable(e.target.value)}
        >
          <option value="all">Todos los cupos</option>
          <option value="available">Con cupos disponibles</option>
        </select>
        
        {(searchQuery || modalityFilter !== 'all' || dateFilter || onlyAvailable !== 'all') && (
          <button 
            className="btn-secondary" 
            style={{ fontSize: '12px', padding: '4px 10px' }}
            onClick={() => {
              setSearchQuery("");
              setModalityFilter("all");
              setDateFilter("");
              setOnlyAvailable("all");
            }}
          >
            Quitar filtros
          </button>
        )}
      </div>

      {/* LISTADO */}
      <div className="sessions-list">
        {filteredSessions.length === 0 ? (
          <div className="no-sessions">
            <p>No se encontraron sesiones que coincidan con los filtros.</p>
            {(searchQuery || modalityFilter !== 'all' || dateFilter || onlyAvailable !== 'all') ? (
              <button className="btn-secondary" onClick={() => {
                setSearchQuery("");
                setModalityFilter("all");
                setDateFilter("");
                setOnlyAvailable("all");
              }}>
                Quitar filtros
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => navigate("/student/create-session")}>
                ¡Sé el primero en proponer una!
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isOwner = s.creador?._id === currentUser?.id;
            const isParticipant = s.participantes.includes(currentUser?.id);
            const pendingRequest = s.solicitudes.find(sol => {
              const solUserId = typeof sol.usuario === 'string' ? sol.usuario : sol.usuario?._id;
              return solUserId === currentUser?.id && sol.estado === 'pendiente';
            });
            const isFull = !!s.cupos && s.participantes.length >= s.cupos;

            return (
              <div key={s._id} className="session-card">
                <div className="session-top">
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{s.materia?.nombre || "Materia no disponible"}</h3>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', marginBottom: 4 }}>
                      {s.tema}
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>Organizada por {isOwner ? "Ti (Tú)" : s.creador?.nombre || "Usuario desconocido"}</p>
                  </div>

                  <span
                    className={`badge ${
                      s.tipo === "presencial"
                        ? "badge-blue"
                        : "badge-purple"
                    }`}
                  >
                    {s.tipo === "presencial" ? "🏢 Presencial" : "💻 Virtual"}
                  </span>
                </div>

                <div className="session-info">
                  <span>📅 {formatFecha(s.fechaHora)}</span>
                  <span>⏰ {formatHora(s.fechaHora)}</span>
                  <span>📍 {s.tipo === "presencial" ? s.ubicacion : "Link virtual"}</span>
                  <span>👥 {s.participantes.length}{s.cupos ? `/${s.cupos}` : ""} participantes</span>
                </div>

                {s.descripcion && (
                  <p className="session-description" style={{ fontSize: '0.9rem', color: '#4b5563', margin: '8px 0 16px 0' }}>
                    {s.descripcion}
                  </p>
                )}

                {/* Gestión de solicitudes para el dueño */}
                {isOwner && s.solicitudes.some(sol => sol.estado === 'pendiente') && (
                  <div className="pending-requests-section" style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #fcd34d' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Solicitudes pendientes:</p>
                    {s.solicitudes.filter(sol => sol.estado === 'pendiente').map(sol => {
                      const solUser = typeof sol.usuario === 'string' ? null : sol.usuario;
                      const solUserId = typeof sol.usuario === 'string' ? sol.usuario : sol.usuario?._id;
                      
                      return (
                        <div key={solUserId || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '0.85rem' }}>{solUser ? solUser.nombre : (typeof sol.usuario === 'string' ? "Cargando..." : "Usuario desconocido")}</span>
                          {solUserId && (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: '2px 8px', fontSize: '11px', background: '#059669' }}
                                onClick={() => handleManageRequest(s._id, solUserId, 'approve')}
                                disabled={actionLoading === `${s._id}-${solUserId}`}
                              >
                                Aceptar
                              </button>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: '11px', color: '#dc2626' }}
                                onClick={() => handleManageRequest(s._id, solUserId, 'reject')}
                                disabled={actionLoading === `${s._id}-${solUserId}`}
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="session-footer">
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ 
                        width: s.cupos ? `${(s.participantes.length / s.cupos) * 100}%` : '100%',
                        background: s.cupos && (s.participantes.length >= s.cupos) ? '#ef4444' : '#2563eb'
                      }} 
                    />
                  </div>

                  {isOwner ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/student/edit-session/${s._id}`)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={() => handleCancel(s._id)}
                        disabled={actionLoading === s._id}
                      >
                        {actionLoading === s._id ? "..." : "Cancelar"}
                      </button>
                    </div>
                  ) : isParticipant ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>✓ Eres miembro</span>
                      <button 
                        onClick={() => handleLeave(s._id)}
                        disabled={actionLoading === s._id}
                        style={{ 
                          background: 'none',
                          border: '1px solid #fca5a5',
                          borderRadius: '8px',
                          color: '#dc2626', 
                          padding: '4px 10px', 
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {actionLoading === s._id ? "..." : "Darse de baja"}
                      </button>
                    </div>
                  ) : pendingRequest ? (
                    <button className="btn-secondary" disabled>Pendiente de aprobación</button>
                  ) : (
                    <button 
                      className="btn-primary"
                      disabled={isFull || actionLoading === s._id}
                      onClick={() => handleJoin(s._id)}
                    >
                      {actionLoading === s._id ? "Cargando..." : isFull ? "Cupos llenos" : s.requiereAprobacion ? "Solicitar unirse" : "Unirse"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudySessions;