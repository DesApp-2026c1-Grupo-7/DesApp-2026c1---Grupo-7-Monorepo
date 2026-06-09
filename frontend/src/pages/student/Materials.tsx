import { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/Materials.css";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
}

interface User {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface Material {
  _id: string;
  titulo: string;
  descripcion: string;
  materia: Subject;
  autor: User;
  tipo: 'archivo' | 'link';
  categoria: 'youtube' | 'drive' | 'web' | 'discord' | 'github' | 'archivo' | 'otro';
  url: string;
  tags: string[];
  createdAt: string;
  size?: number;
}

export default function Materials() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    materia: "",
    tipo: "archivo",
    categoria: "archivo",
    url: "",
    tags: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchMaterials(selectedSubject._id);
    }
  }, [selectedSubject, search]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/materias");
      setSubjects(res.data);
    } catch (err) {
      console.error("Error al cargar materias", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (subjectId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/materiales?materia=${subjectId}&search=${search}`);
      setMaterials(res.data);
    } catch (err) {
      console.error("Error al cargar materiales", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData(prev => ({
      ...prev,
      materia: selectedSubject?._id || ""
    }));
    setError("");
    setSuccess("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      titulo: "",
      descripcion: "",
      materia: "",
      tipo: "archivo",
      categoria: "archivo",
      url: "",
      tags: ""
    });
    setSelectedFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "url" && formData.tipo === "link") {
      if (value.includes("youtube.com") || value.includes("youtu.be")) {
        setFormData(prev => ({ ...prev, categoria: "youtube" }));
      } else if (value.includes("drive.google.com") || value.includes("dropbox.com")) {
        setFormData(prev => ({ ...prev, categoria: "drive" }));
      } else if (value.includes("github.com")) {
        setFormData(prev => ({ ...prev, categoria: "github" }));
      } else if (value.includes("discord.gg") || value.includes("discord.com")) {
        setFormData(prev => ({ ...prev, categoria: "discord" }));
      } else {
        setFormData(prev => ({ ...prev, categoria: "web" }));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSelectedFile(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar extensión
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.zip'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        setError("Formato de archivo no permitido");
        return;
      }

      // Validar tamaño
      if (file.size > 25 * 1024 * 1024) {
        setError("El archivo no debe superar los 25 MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("titulo", formData.titulo);
      data.append("descripcion", formData.descripcion);
      data.append("materia", formData.materia);
      data.append("tipo", formData.tipo);
      data.append("categoria", formData.categoria);
      data.append("tags", formData.tags);

      if (formData.tipo === "archivo") {
        if (!selectedFile) throw new Error("Debe seleccionar un archivo");
        if (selectedFile.size > 25 * 1024 * 1024) {
          throw new Error("El archivo no debe superar los 25 MB");
        }
        data.append("archivo", selectedFile);
      } else {
        if (!formData.url) throw new Error("Debe ingresar una URL");
        data.append("url", formData.url);
      }

      await api.post("/materiales", data);

      setSuccess("Material compartido con éxito");
      setTimeout(() => {
        handleCloseModal();
        if (selectedSubject) fetchMaterials(selectedSubject._id);
      }, 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string, error?: { message?: string } } } };
      const apiError = axiosErr.response?.data?.mensaje || axiosErr.response?.data?.error?.message;
      const errorMsg = err instanceof Error ? err.message : "Error al compartir material";
      setError(apiError || errorMsg);
    } finally {
      setUploadLoading(false);
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'youtube': return "🎬";
      case 'drive': return "📁";
      case 'github': return "💻";
      case 'discord': return "💬";
      case 'web': return "🌐";
      case 'archivo': return "📄";
      default: return "🔗";
    }
  };

  const handleAction = (material: Material) => {
    const url = material.tipo === 'archivo' 
      ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${material.url}`
      : material.url;
    
    window.open(url, '_blank');
  };

  const filteredSubjects = subjects.filter(s => 
    s.nombre.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.codigo.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <div className="materials-container">
      {selectedSubject && (
        <button 
          className="btn-secondary" 
          onClick={() => setSelectedSubject(null)}
          style={{ marginBottom: '20px' }}
        >
          ← Volver a Materias
        </button>
      )}

      {/* HEADER */}
      <div className="materials-header">
        <div className="header-left">
          <div className="header-center">
            <h2>{selectedSubject ? `Repositorio: ${selectedSubject.nombre}` : "Materiales de Estudio"}</h2>
            <p>{selectedSubject ? `Recursos compartidos para esta materia` : "Selecciona una materia para ver su repositorio"}</p>
          </div>
        </div>

        <div className="header-right">
          <button className="btn-primary" onClick={handleOpenModal}>+ Compartir Material</button>
        </div>
      </div>

      <div className="materials-filters">
        <input
          type="text"
          className="search-input"
          placeholder={selectedSubject ? "Buscar en este repositorio..." : "Buscar materia..."}
          value={selectedSubject ? search : subjectSearch}
          onChange={(e) => selectedSubject ? setSearch(e.target.value) : setSubjectSearch(e.target.value)}
        />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : !selectedSubject ? (
        /* VISTA DE REPOSITORIOS (MATERIAS) */
        <>
          {filteredSubjects.length === 0 ? (
            <div className="no-results py-10 text-center">No se encontraron materias con ese nombre.</div>
          ) : (
            <div className="repositories-grid">
              {filteredSubjects.map((s) => (
                <div key={s._id} className="repository-card" onClick={() => setSelectedSubject(s)}>
                  <div className="repo-icon">📚</div>
                  <div className="repo-info">
                    <h3>{s.nombre}</h3>
                    <span className="repo-code">{s.codigo}</span>
                  </div>
                  <div className="repo-arrow">→</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* VISTA DE MATERIALES DEL REPOSITORIO SELECCIONADO */
        <div className="materials-list">
          {materials.length === 0 ? (
            <div className="no-results py-10 text-center">
              No hay materiales compartidos en esta materia todavía. <br />
              ¡Sé el primero en compartir algo!
            </div>
          ) : (
            materials.map((m) => (
              <div key={m._id} className="material-card">
                <div className="material-top">
                  <div className={`category-icon category-${m.categoria}`}>
                    {getCategoryIcon(m.categoria)}
                  </div>

                  <div className="material-info">
                    <h4>{m.titulo}</h4>
                    <p className="material-desc">{m.descripcion || "Sin descripción"}</p>
                  </div>
                </div>

                <div className="material-tags">
                  {m.tags?.map((tag, idx) => (
                    <span key={idx} className="tag">#{tag}</span>
                  ))}
                </div>

                <div className="material-footer">
                  <div className="author-meta">
                    Por {m.autor?.nombre || 'Usuario'} {m.autor?.apellido || ''} <br />
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Sin fecha'}
                  </div>

                  <button 
                    className={`btn-primary ${m.categoria === 'discord' ? 'discord-btn' : ''}`}
                    onClick={() => handleAction(m)}
                  >
                    {m.categoria === 'discord' ? 'Unirse' : (m.tipo === 'archivo' ? 'Descargar' : 'Ver Recurso')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL UPLOAD */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Compartir Material</h3>
              <button className="close-button" onClick={handleCloseModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <div className="form-group">
                <label>Título *</label>
                <input 
                  type="text" 
                  name="titulo" 
                  value={formData.titulo || ""} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Ej: Resumen primer parcial"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  name="descripcion" 
                  value={formData.descripcion || ""} 
                  onChange={handleInputChange} 
                  placeholder="Breve descripción del recurso..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Materia *</label>
                <select name="materia" value={formData.materia || ""} onChange={handleInputChange} required>
                  <option value="">Seleccionar materia</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.nombre} ({s.codigo})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de Material: *</label>
                <div style={{ display: 'flex', gap: '24px', marginBottom: '8px', justifyContent: 'center', padding: '10px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input 
                      type="radio" 
                      name="tipo" 
                      value="archivo" 
                      checked={formData.tipo === "archivo"} 
                      onChange={handleInputChange}
                    /> 
                    Archivo
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                    <input 
                      type="radio" 
                      name="tipo" 
                      value="link" 
                      checked={formData.tipo === "link"} 
                      onChange={handleInputChange}
                    /> 
                    Link Externo
                  </label>
                </div>
              </div>

              {formData.tipo === "archivo" ? (
                <div className="form-group">
                  <label>Archivo (PDF, DOCX, PPTX, JPG, PNG, ZIP - Max 25MB) *</label>
                  <input type="file" onChange={handleFileChange} required={formData.tipo === "archivo"} />
                </div>
              ) : (
                <div className="form-group">
                  <label>URL del material *</label>
                  <input 
                    type="url" 
                    name="url" 
                    value={formData.url || ""} 
                    onChange={handleInputChange} 
                    placeholder="https://..." 
                    required={formData.tipo === "link"}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Tags / Etiquetas (separadas por coma)</label>
                <input 
                  type="text" 
                  name="tags" 
                  value={formData.tags || ""} 
                  onChange={handleInputChange} 
                  placeholder="resumen, tp, parcial, guia"
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary btn-full" 
                disabled={uploadLoading}
              >
                {uploadLoading ? "Subiendo..." : "Publicar Material"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}