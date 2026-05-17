import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Social.css";

interface EventPost {
  _id: string;
  autor: {
    _id: string;
    nombre: string;
    foto?: string;
    carrera?: { nombre: string };
  };
  tipo: "posteo" | "academico";
  contenido: string;
  createdAt: string;
}

export default function Feed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const res = await api.get("/eventos/feed");
      setEvents(res.data);
    } catch {
      setError("No se pudo cargar el feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFeed();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadFeed]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await api.post("/eventos", { contenido: newPost.trim() });
      setNewPost("");
      loadFeed();
    } catch {
      setError("Error al publicar. Intenta de nuevo.");
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <div className="social-container">
      <h1>Feed Académico</h1>
      <p className="subtitle">
        Actividad de tus contactos y perfiles públicos que comparten eventos
      </p>

      {error && (
        <div className="message-banner error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Publicar</h3>
        <form onSubmit={handlePost} style={{ marginTop: "0.75rem" }}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Compartí algo académico con tu red..."
            maxLength={500}
            style={{
              width: "100%",
              minHeight: 80,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              boxSizing: "border-box"
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "0.5rem"
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {newPost.length}/500
            </span>
            <button
              type="submit"
              className="btn primary"
              disabled={posting || !newPost.trim()}
            >
              {posting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      {loading ? (
        <p>Cargando feed...</p>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-muted)" }}>
            No hay publicaciones visibles aún.
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Sumá contactos o seguí perfiles públicos que compartan eventos.
          </p>
        </div>
      ) : (
        events.map((ev) => (
          <div key={ev._id} className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "0.75rem" }}>
              <div
                className="avatar"
                style={{ width: 40, height: 40, flexShrink: 0, cursor: "pointer" }}
                onClick={() => navigate(`/student/perfil/${ev.autor._id}`)}
              >
                {ev.autor.foto ? (
                  <img
                    src={ev.autor.foto}
                    alt={ev.autor.nombre}
                    style={{
                      borderRadius: "50%",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  "👤"
                )}
              </div>
              <div>
                <strong
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/student/perfil/${ev.autor._id}`)}
                >
                  {ev.autor.nombre}
                </strong>
                <p
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}
                >
                  {ev.autor.carrera?.nombre || "Estudiante"} ·{" "}
                  {formatDate(ev.createdAt)}
                  {ev.tipo === "academico" && (
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "2px 6px",
                        background: "#dbeafe",
                        color: "#1e40af",
                        borderRadius: 4,
                        fontSize: "0.75rem"
                      }}
                    >
                      Académico
                    </span>
                  )}
                </p>
              </div>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{ev.contenido}</p>
          </div>
        ))
      )}
    </div>
  );
}
