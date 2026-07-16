import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
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
  editado?: boolean;
  createdAt: string;
}

export default function Feed() {
  const navigate = useNavigate();
  // El id del usuario puede venir como `id` (login/registro) o `_id` (onboarding
  // de Google / actualización de perfil), según el endpoint que escribió localStorage.
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = storedUser.id || storedUser._id;
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Menú de acciones (kebab) y edición inline de publicaciones propias
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast, showToast, hideToast } = useToast();

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

  // Cierra el menú de acciones al hacer clic fuera de él. Usamos un listener de
  // documento en vez de un overlay porque las tarjetas tienen backdrop-filter
  // (crean stacking context) y un overlay quedaría por encima del dropdown.
  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".post-menu")) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

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

  const startEdit = (ev: EventPost) => {
    setEditingId(ev._id);
    setEditText(ev.contenido);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/eventos/${id}`, { contenido: editText.trim() });
      setEvents((prev) => prev.map((e) => (e._id === id ? res.data : e)));
      setEditingId(null);
      setEditText("");
      showToast("Posteo editado correctamente", "success");
    } catch {
      showToast("No se pudo editar la publicación", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    if (!confirm("¿Eliminar esta publicación?")) return;
    try {
      await api.delete(`/eventos/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
      showToast("Posteo eliminado correctamente", "success");
    } catch {
      showToast("No se pudo eliminar la publicación", "error");
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
      <Toast toast={toast} onClose={hideToast} />
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
        events.map((ev) => {
          // Solo se pueden editar/eliminar los posteos propios hechos manualmente.
          // Los eventos académicos automáticos ("Aprobó la materia X") no llevan menú.
          const puedeEditar = ev.autor._id === currentUserId && ev.tipo === "posteo";
          return (
            <div key={ev._id} className="card post-card" style={{ marginBottom: "1rem" }}>
              {puedeEditar && (
                <div className="post-menu">
                  <button
                    className="post-menu-btn"
                    onClick={() => setMenuOpenId(menuOpenId === ev._id ? null : ev._id)}
                    aria-label="Opciones de la publicación"
                    aria-expanded={menuOpenId === ev._id}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menuOpenId === ev._id && (
                    <div className="post-menu-dropdown">
                      <button className="post-menu-item" onClick={() => startEdit(ev)}>
                        <Pencil size={15} /> Editar
                      </button>
                      <button
                        className="post-menu-item danger"
                        onClick={() => handleDelete(ev._id)}
                      >
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                    {ev.editado && (
                      <span style={{ fontStyle: "italic" }}> (Editado)</span>
                    )}
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

              {editingId === ev._id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
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
                      justifyContent: "flex-end",
                      gap: "0.5rem",
                      marginTop: "0.5rem"
                    }}
                  >
                    <button className="btn secondary" onClick={cancelEdit} disabled={savingEdit}>
                      Cancelar
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => handleSaveEdit(ev._id)}
                      disabled={savingEdit || !editText.trim()}
                    >
                      {savingEdit ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{ev.contenido}</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
