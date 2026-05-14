import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";
import "../../styles/Profile.css";

interface ProfileData {
  _id: string;
  nombre: string;
  email: string;
  role: string;
  bio?: string;
  foto?: string;
  carrera?: { nombre: string };
  configuracionPrivacidad: {
    perfil: "publico" | "privado";
    mostrarEmail: boolean;
    mostrarSituacionAcademica: boolean;
  };
  situacionAcademica?: {
    _id: string;
    materia: {
      nombre: string;
      anio: number;
    };
    estado: string;
    nota?: number;
    fecha: string;
  }[];
}

const DEFAULT_PRIVACY = {
  perfil: "publico" as const,
  mostrarEmail: true,
  mostrarSituacionAcademica: true,
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    nombre: "",
    bio: "",
    foto: "",
    configuracionPrivacidad: { ...DEFAULT_PRIVACY } as ProfileData["configuracionPrivacidad"]
  });

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get("/perfil/me");
      const data = response.data;
      
      const sanitizedData = {
        ...data,
        configuracionPrivacidad: {
          ...DEFAULT_PRIVACY,
          ...(data.configuracionPrivacidad || {})
        }
      };
      
      setProfile(sanitizedData);
      setFormData({
        nombre: sanitizedData.nombre || "",
        bio: sanitizedData.bio || "",
        foto: sanitizedData.foto || "",
        configuracionPrivacidad: { ...sanitizedData.configuracionPrivacidad }
      });
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      setMessage({ text: "Error al cargar el perfil. Intenta recargar la página.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: "La imagen es demasiado grande (máximo 2MB)", type: "error" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Enviamos el formData completo al backend
      const response = await api.put("/perfil/me", formData);
      
      const updatedUser = response.data.user;
      const sanitizedUpdated = {
        ...updatedUser,
        configuracionPrivacidad: {
          ...DEFAULT_PRIVACY,
          ...(updatedUser.configuracionPrivacidad || {})
        }
      };

      setProfile(sanitizedUpdated);
      setEditing(false);
      setMessage({ text: "¡Perfil actualizado con éxito!", type: "success" });
      
      // Actualizamos localStorage por si otras partes de la app lo usan
      localStorage.setItem("user", JSON.stringify(sanitizedUpdated));
      
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      setMessage({ text: "No se pudieron guardar los cambios. Revisa tu conexión.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando tu perfil profesional...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-alert error">
          <span>⚠️</span> No pudimos encontrar tu información de perfil.
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1>Mi Perfil</h1>
      <p className="subtitle">Gestiona tu presencia académica y configuraciones de privacidad</p>

      {message && (
        <div className={`profile-alert ${message.type}`}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          {message.text}
        </div>
      )}

      {/* CARD PRINCIPAL DE PERFIL */}
      <div className="card profile-header-card">
        <div className="avatar-wrapper">
          <div className="avatar-main">
            {editing ? (
              formData.foto ? <img src={formData.foto} alt="Vista previa" /> : "👤"
            ) : (
              profile.foto ? <img src={profile.foto} alt="Perfil" /> : "👤"
            )}
          </div>
          {editing && (
            <div className="avatar-upload-trigger" onClick={() => fileInputRef.current?.click()}>
              📷
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        <div className="user-info-main">
          {editing ? (
            <div className="edit-input-group" style={{ textAlign: 'center' }}>
              <input 
                type="text" 
                className="full-width-input"
                style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre completo"
              />
            </div>
          ) : (
            <h2>{profile.nombre}</h2>
          )}
          
          <span className="role-badge">
            {profile.role === 'admin' ? 'ADMINISTRADOR' : 'ESTUDIANTE'}
          </span>

          {!editing && (
            <div className="user-meta-grid">
              <div className="meta-item">
                <label>Email</label>
                <span>{profile.email}</span>
              </div>
              <div className="meta-item">
                <label>Carrera</label>
                <span>{profile.carrera?.nombre || "No especificada"}</span>
              </div>
            </div>
          )}

          {editing ? (
            <div className="edit-input-group">
              <label>Biografía Profesional</label>
              <textarea 
                className="full-width-input"
                placeholder="Cuéntanos un poco sobre ti, tus intereses y metas académicas..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={500}
              />
            </div>
          ) : (
            <p className="bio-text">
              {profile.bio || "Aún no has agregado una biografía. ¡Cuéntale a la comunidad quién eres!"}
            </p>
          )}

          {editing && (
            <div className="photo-edit-options">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>URL de imagen externa (opcional)</label>
              <input 
                type="text"
                className="full-width-input"
                placeholder="https://ejemplo.com/foto.jpg"
                value={formData.foto.startsWith('data:') ? '' : formData.foto}
                onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      {/* CARD DE SITUACIÓN ACADÉMICA */}
      {profile.situacionAcademica && profile.situacionAcademica.length > 0 && (
        <div className="card">
          <div className="privacy-header">
            <span>🎓</span>
            <h3>Situación Académica</h3>
          </div>
          <div className="academic-grid">
            {profile.situacionAcademica.map((item) => (
              <div key={item._id} className="academic-item">
                <div className="academic-info">
                  <span className="subject-name">{item.materia.nombre}</span>
                  <span className="subject-year">{item.materia.anio}° Año</span>
                </div>
                <div className="academic-status">
                  <span className={`status-badge ${item.estado.toLowerCase()}`}>
                    {item.estado}
                  </span>
                  {item.nota && <span className="grade-badge">{item.nota}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CARD DE PRIVACIDAD */}
      <div className="card">
        <div className="privacy-header">
          <span>🔒</span>
          <h3>Configuraciones de Privacidad</h3>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h4>Visibilidad del Perfil</h4>
            <p>Define si cualquier estudiante puede encontrar tu perfil</p>
          </div>
          <select 
            className="full-width-input"
            style={{ width: 'auto' }}
            value={formData.configuracionPrivacidad.perfil}
            disabled={!editing}
            onChange={(e) => setFormData({
              ...formData,
              configuracionPrivacidad: {
                ...formData.configuracionPrivacidad,
                perfil: e.target.value as "publico" | "privado"
              }
            })}
          >
            <option value="publico">Público</option>
            <option value="privado">Privado</option>
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h4>Mostrar Email</h4>
            <p>Permitir que otros estudiantes vean tu dirección de contacto</p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              disabled={!editing}
              checked={formData.configuracionPrivacidad.mostrarEmail}
              onChange={(e) => setFormData({
                ...formData,
                configuracionPrivacidad: {
                  ...formData.configuracionPrivacidad,
                  mostrarEmail: e.target.checked
                }
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h4>Compartir Situación Académica</h4>
            <p>Mostrar tus materias aprobadas y regularizadas en tu perfil público</p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              disabled={!editing}
              checked={formData.configuracionPrivacidad.mostrarSituacionAcademica}
              onChange={(e) => setFormData({
                ...formData,
                configuracionPrivacidad: {
                  ...formData.configuracionPrivacidad,
                  mostrarSituacionAcademica: e.target.checked
                }
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* BARRA DE ACCIONES */}
      <div className="profile-actions-bar">
        {editing ? (
          <>
            <button className="btn-secondary btn-large" onClick={() => {
              setEditing(false);
              // Re-inicializamos el form con los datos originales
              setFormData({
                nombre: profile.nombre,
                bio: profile.bio || "",
                foto: profile.foto || "",
                configuracionPrivacidad: { ...profile.configuracionPrivacidad }
              });
            }}>
              Cancelar
            </button>
            <button className="btn-primary btn-large" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </>
        ) : (
          <button className="btn-primary btn-large" onClick={() => setEditing(true)}>
            Editar Perfil
          </button>
        )}
      </div>
    </div>
  );
}