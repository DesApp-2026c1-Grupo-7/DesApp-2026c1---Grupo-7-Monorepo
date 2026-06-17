import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import "../../styles/Materials.css";
import { Flag, AlertTriangle, CheckCircle, Info, Filter } from "lucide-react";

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

interface ReportReason {
  _id: string;
  titulo: string;
  descripcion?: string;
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
  likes: number;
  dislikes: number;
  totalValoraciones: number;
  ratio: number;
  userVote?: number;
  pendingReports: number;
  verifiedReports: number;
  suspendido: boolean;
}

export default function Materials() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [sortBy, setSortBy] = useState("recientes");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Admin filters
  const [filterReported, setFilterReported] = useState(false);
  const [filterSuspended, setFilterSuspended] = useState(false);

  // User role check
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || "");
  }, []);

  const isAdmin = userRole === 'admin';

  // Reporting state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [reportData, setReportData] = useState({
    reasonId: "",
    motivoEspecifico: "",
    detalle: ""
  });
  const [reportLoading, setReportLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/materias");
      setSubjects(res.data);
    } catch (err) {
      console.error("Error al cargar materias", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaterials = useCallback(async (subjectId: string) => {
    try {
      setLoading(true);
      const sortParam = sortBy === 'valoracion' ? 'valoracion' : 'recientes';
      const res = await api.get(`/materiales?materia=${subjectId}&search=${search}&sort=${sortParam}`);
      
      let data = res.data;
      if (filterReported) {
        data = data.filter((m: Material) => m.pendingReports > 0 || m.verifiedReports > 0);
      }
      if (filterSuspended) {
        data = data.filter((m: Material) => m.suspendido);
      }
      
      setMaterials(data);
    } catch (err) {
      console.error("Error al cargar materiales", err);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, filterReported, filterSuspended]);

  const fetchReasons = useCallback(async () => {
    try {
      const res = await api.get("/denuncias/reasons");
      setReasons(res.data);
    } catch (err) {
      console.error("Error al cargar motivos de denuncia", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchSubjects();
      await fetchReasons();
    })();
  }, [fetchSubjects, fetchReasons]);

  useEffect(() => {
    if (selectedSubject) {
      (async () => {
        await fetchMaterials(selectedSubject._id);
      })();
    }
  }, [selectedSubject, fetchMaterials]);

  const handleRate = async (materialId: string, voto: number) => {
    try {
      await api.post(`/materiales/${materialId}/valorar`, { voto });
      if (selectedSubject) fetchMaterials(selectedSubject._id);
    } catch (err) {
      console.error("Error al valorar material", err);
    }
  };

  // Report Modal Handlers
  const handleOpenReportModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsReportModalOpen(true);
    setReportData({ reasonId: "", motivoEspecifico: "", detalle: "" });
    setError("");
    setSuccess("");
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedMaterial(null);
  };

  const handleReportInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    
    setReportLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/denuncias", {
        materialId: selectedMaterial._id,
        reasonId: reportData.reasonId,
        motivoEspecifico: reportData.motivoEspecifico,
        detalle: reportData.detalle
      });

      setSuccess("Denuncia enviada correctamente. Gracias por ayudar a moderar el contenido.");
      setTimeout(() => {
        handleCloseReportModal();
        if (selectedSubject) fetchMaterials(selectedSubject._id);
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      setError(axiosErr.response?.data?.mensaje || "Error al enviar la denuncia");
    } finally {
      setReportLoading(false);
    }
  };

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
    if (material.suspendido && !isAdmin) {
      alert("Este material se encuentra suspendido temporalmente por denuncias de la comunidad.");
      return;
    }

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
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder={selectedSubject ? "Buscar en este repositorio..." : "Buscar materia..."}
            value={selectedSubject ? search : subjectSearch}
            onChange={(e) => selectedSubject ? setSearch(e.target.value) : setSubjectSearch(e.target.value)}
          />
        </div>

        {selectedSubject && isAdmin && (
          <div className="admin-filters">
            <button 
              className={`filter-tag ${filterReported ? 'active' : ''}`}
              onClick={() => setFilterReported(!filterReported)}
            >
              <Flag size={14} /> Con Denuncias
            </button>
            <button 
              className={`filter-tag ${filterSuspended ? 'active' : ''}`}
              onClick={() => setFilterSuspended(!filterSuspended)}
            >
              <AlertTriangle size={14} /> Suspendidos
            </button>
          </div>
        )}
      </div>

      {selectedSubject && (
        <div className="sort-container">
          <span className="sort-label">Ordenar por:</span>
          <select 
            className="sort-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recientes">Más recientes</option>
            <option value="valoracion">Mejor valorados</option>
          </select>
        </div>
      )}

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
              <div key={m._id} className={`material-card ${m.suspendido ? 'is-suspended' : ''}`}>
                <div className="material-top">
                  <div className={`category-icon category-${m.categoria}`}>
                    {getCategoryIcon(m.categoria)}
                  </div>

                  <div className="material-info">
                    <div className="title-row">
                      <h4>{m.titulo}</h4>
                      {m.suspendido && <span className="suspended-badge">Suspendido</span>}
                    </div>
                    <p className="material-desc">{m.descripcion || "Sin descripción"}</p>
                  </div>
                </div>

                {/* STATUS DE DENUNCIAS */}
                <div className="report-status-box">
                  {m.suspendido ? (
                    <span className="status-suspended">
                      <AlertTriangle size={14} /> Suspendido
                    </span>
                  ) : m.verifiedReports > 0 ? (
                    <span className="status-verified">
                      <CheckCircle size={14} /> {m.verifiedReports} denuncias verificadas
                    </span>
                  ) : m.pendingReports > 0 ? (
                    <span className="status-pending">
                      <Info size={14} /> {m.pendingReports} denuncias pendientes
                    </span>
                  ) : (
                    <span className="status-clean">Sin denuncias</span>
                  )}
                </div>

                <div className="material-tags">
                  {m.tags?.map((tag, idx) => (
                    <span key={idx} className="tag">#{tag}</span>
                  ))}
                </div>

                <div className="material-ratings">
                  <div 
                    className={`rating-item ${m.userVote === 1 ? 'active-up' : ''}`}
                    onClick={() => handleRate(m._id, 1)}
                    title="Pulgar arriba"
                  >
                    👍 {m.likes || 0}
                  </div>
                  <div className="rating-divider"></div>
                  <div 
                    className={`rating-item ${m.userVote === -1 ? 'active-down' : ''}`}
                    onClick={() => handleRate(m._id, -1)}
                    title="Pulgar abajo"
                  >
                    👎 {m.dislikes || 0}
                  </div>
                  {m.totalValoraciones > 0 && (
                    <>
                      <div className="rating-divider"></div>
                      <div className="rating-ratio">
                        Ratio: <span className="ratio-badge">{(m.ratio * 100).toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="material-footer">
                  <div className="author-meta">
                    Por {m.autor?.nombre || 'Usuario'} <br />
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Sin fecha'}
                  </div>

                  <div className="action-buttons">
                    <button 
                      className="btn-report"
                      onClick={() => handleOpenReportModal(m)}
                      title="Denunciar contenido inapropiado"
                      disabled={m.suspendido && !isAdmin}
                    >
                      🚩
                    </button>
                    <button 
                      className={`btn-primary ${m.categoria === 'discord' ? 'discord-btn' : ''} ${m.suspendido && !isAdmin ? 'btn-disabled' : ''}`}
                      onClick={() => handleAction(m)}
                    >
                      {m.categoria === 'discord' ? 'Unirse' : (m.tipo === 'archivo' ? 'Descargar' : 'Ver Recurso')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DENUNCIA */}
      {isReportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Denunciar Material</h3>
              <button className="close-button" onClick={handleCloseReportModal}>&times;</button>
            </div>

            <form onSubmit={handleReportSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <p className="modal-subtitle">
                Material: <strong>{selectedMaterial?.titulo}</strong>
              </p>

              <div className="form-group">
                <label>Motivo de la denuncia *</label>
                <select 
                  name="reasonId" 
                  value={reportData.reasonId} 
                  onChange={handleReportInputChange} 
                  required
                >
                  <option value="">Seleccionar motivo</option>
                  {reasons.map(r => (
                    <option key={r._id} value={r._id}>{r.titulo}</option>
                  ))}
                </select>
              </div>

              {reasons.find(r => r._id === reportData.reasonId)?.titulo.toLowerCase() === 'otro' && (
                <div className="form-group">
                  <label>Especificar motivo *</label>
                  <input 
                    type="text" 
                    name="motivoEspecifico" 
                    value={reportData.motivoEspecifico} 
                    onChange={handleReportInputChange} 
                    required 
                    placeholder="Especifique el motivo de la denuncia"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Detalles adicionales *</label>
                <textarea 
                  name="detalle" 
                  value={reportData.detalle} 
                  onChange={handleReportInputChange} 
                  required 
                  placeholder="Proporcione más información sobre por qué denuncia este contenido..."
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseReportModal}
                  disabled={reportLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-danger" 
                  disabled={reportLoading}
                >
                  {reportLoading ? "Enviando..." : "Enviar Denuncia"}
                </button>
              </div>
            </form>
          </div>
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