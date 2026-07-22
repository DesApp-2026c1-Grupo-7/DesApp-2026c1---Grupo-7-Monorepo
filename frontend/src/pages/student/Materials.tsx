import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import api from "../../services/api";
import "../../styles/Materials.css";
import { resolveMaterialUrl } from "../../utils/materialUrl";
import { getMaterialIconDisplay, getPlatformCardClass } from "../../utils/materialIcon";
import MaterialCategoryIcon from "../../components/MaterialCategoryIcon";
import SearchableSelect from "../../components/SearchableSelect";
import { Flag, AlertTriangle, CheckCircle, Info, Trash2 } from "lucide-react";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

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

interface DiscordMetadata {
  serverName?: string;
  channelName?: string;
  channelDescription?: string;
  memberCount?: number;
  inviteCode?: string;
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
  nombreOriginal?: string;
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
  userReported: boolean;
  suspendido: boolean;
  discordMetadata?: DiscordMetadata;
}

// Un material tiene denuncias si acumula reportes pendientes o verificados.
const tieneDenuncias = (m: Material) => m.pendingReports + m.verifiedReports > 0;

export default function Materials() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [sortBy, setSortBy] = useState("recientes");
  const [filterBy, setFilterBy] = useState("todos");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Admin filters
  const [filterReported, setFilterReported] = useState(false);
  const [filterSuspended, setFilterSuspended] = useState(false);

  // User role check (se calcula una sola vez desde localStorage)
  const [userRole, currentUserId] = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return [user.role || "", user.id || ""] as const;
  }, []);

  const isAdmin = userRole === 'admin';
  const esAutor = (material: Material) => material.autor?._id === currentUserId;
  const canDeleteMaterial = (material: Material) =>
    isAdmin || esAutor(material);

  // Reporting state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [reportData, setReportData] = useState<{ reasonIds: string[]; motivoEspecifico: string; detalle: string }>({
    reasonIds: [],
    motivoEspecifico: "",
    detalle: ""
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [reasonsDropdownOpen, setReasonsDropdownOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      if (filterBy === 'denunciados') {
        data = data.filter(tieneDenuncias);
      } else if (filterBy === 'propios') {
        data = data.filter((m: Material) => m.autor?._id === currentUserId);
      } else if (filterBy === 'amigos') {
        data = data.filter((m: Material) => contactIds.includes(m.autor?._id));
      }
      if (filterReported) {
        data = data.filter(tieneDenuncias);
      }
      if (filterSuspended) {
        data = data.filter((m: Material) => m.suspendido);
      }
      if (sortBy === 'alfabetico') {
        data = [...data].sort((a: Material, b: Material) =>
          a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }));
      }

      setMaterials(data);
    } catch (err) {
      console.error("Error al cargar materiales", err);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, filterBy, filterReported, filterSuspended, currentUserId, contactIds]);

  const fetchAllMaterialCounts = useCallback(async () => {
    try {
      const res = await api.get('/materiales');
      const counts: Record<string, number> = {};
      for (const m of res.data as Material[]) {
        const id = m.materia?._id;
        if (!id) continue;
        counts[id] = (counts[id] || 0) + 1;
      }
      setMaterialCounts(counts);
    } catch (err) {
      console.error('Error al cargar conteos de materiales', err);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get("/invitaciones/contactos");
      setContactIds(res.data.map((c: { _id: string }) => c._id));
    } catch (err) {
      console.error("Error al cargar contactos", err);
    }
  }, []);

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
      await fetchContacts();
      await fetchAllMaterialCounts();
    })();
  }, [fetchSubjects, fetchReasons, fetchContacts, fetchAllMaterialCounts]);

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

  const openDeleteModal = (material: Material) => {
    setMaterialToDelete(material);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setMaterialToDelete(null);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/materiales/${materialToDelete._id}`);
      setMaterials((prev) => prev.filter((m) => m._id !== materialToDelete._id));
      showToast("Material eliminado correctamente", "success");
      setMaterialToDelete(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      showToast(axiosErr.response?.data?.mensaje || "No se pudo eliminar el material", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Report Modal Handlers
  const handleOpenReportModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsReportModalOpen(true);
    setReportData({ reasonIds: [], motivoEspecifico: "", detalle: "" });
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedMaterial(null);
    setReasonsDropdownOpen(false);
  };

  const handleReportInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
  };

  const handleReasonToggle = (reasonId: string) => {
    setReportData(prev => ({
      ...prev,
      reasonIds: prev.reasonIds.includes(reasonId)
        ? prev.reasonIds.filter(id => id !== reasonId)
        : [...prev.reasonIds, reasonId]
    }));
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    if (reportData.reasonIds.length === 0) {
      showToast("Seleccioná al menos un motivo", "error");
      return;
    }

    setReportLoading(true);

    try {
      await api.post("/denuncias", {
        materialId: selectedMaterial._id,
        reasonIds: reportData.reasonIds,
        motivoEspecifico: reportData.motivoEspecifico,
        detalle: reportData.detalle
      });

      handleCloseReportModal();
      showToast("Denuncia enviada correctamente. Gracias por ayudar a moderar el contenido.", "success");
      if (selectedSubject) fetchMaterials(selectedSubject._id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string } } };
      showToast(axiosErr.response?.data?.mensaje || "No se pudo enviar la denuncia", "error");
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
  const { toast, showToast, hideToast } = useToast();

  const [discordInfo, setDiscordInfo] = useState<DiscordMetadata | null>(null);
  const [discordInfoLoading, setDiscordInfoLoading] = useState(false);
  const [discordServerName, setDiscordServerName] = useState("");
  const [discordChannelName, setDiscordChannelName] = useState("");
  const [discordChannelDescription, setDiscordChannelDescription] = useState("");

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData(prev => ({
      ...prev,
      materia: selectedSubject?._id || ""
    }));
  };

  // URL para la que ya trajimos la info, para no repetir la llamada al perder foco.
  const lastDiscordUrlRef = useRef<string>("");

  const fetchDiscordInfo = async (opts?: { soloSiVacio?: boolean }) => {
    if (!formData.url) return;
    setDiscordInfoLoading(true);
    try {
      const res = await api.get(`/materiales/discord-info?url=${encodeURIComponent(formData.url)}`);
      const data = res.data;
      lastDiscordUrlRef.current = formData.url;
      setDiscordInfo(data);
      // En el autocompletado (onBlur) no pisamos lo que el usuario ya escribio.
      if (data.serverName) setDiscordServerName(prev => (opts?.soloSiVacio && prev) ? prev : data.serverName);
      if (data.channelName) setDiscordChannelName(prev => (opts?.soloSiVacio && prev) ? prev : data.channelName);
      if (data.channelDescription) setDiscordChannelDescription(prev => (opts?.soloSiVacio && prev) ? prev : data.channelDescription);
    } catch {
      setDiscordInfo(null);
    } finally {
      setDiscordInfoLoading(false);
    }
  };

  // Autocompleta la info de Discord (incluido memberCount) al salir del campo URL,
  // asi el conteo de miembros se guarda sin depender del boton de la lupa.
  const handleDiscordUrlBlur = () => {
    if (formData.categoria !== "discord" || !formData.url) return;
    if (lastDiscordUrlRef.current === formData.url) return;
    fetchDiscordInfo({ soloSiVacio: true });
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
    setDiscordInfo(null);
    setDiscordServerName("");
    setDiscordChannelName("");
    setDiscordChannelDescription("");
    lastDiscordUrlRef.current = "";
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
    setSelectedFile(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validar extensión
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.zip'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        showToast("Formato de archivo no permitido", "error");
        return;
      }

      // Validar tamaño
      if (file.size > 25 * 1024 * 1024) {
        showToast("El archivo no debe superar los 25 MB", "error");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);

    try {
      if (!formData.materia) throw new Error("Seleccioná una materia válida de la lista");
      const data = new FormData();
      data.append("titulo", formData.titulo);
      data.append("descripcion", formData.descripcion);
      data.append("materia", formData.materia);
      data.append("tipo", formData.tipo);
      data.append("categoria", formData.categoria);
      data.append("tags", formData.tags);

      if (formData.categoria === "discord") {
        if (!discordServerName.trim()) throw new Error("El nombre del servidor es obligatorio");
        if (!discordChannelName.trim()) throw new Error("El canal es obligatorio");
        data.append("discordMetadata", JSON.stringify({
          serverName: discordServerName,
          channelName: discordChannelName,
          channelDescription: discordChannelDescription,
          memberCount: discordInfo?.memberCount ?? null,
          inviteCode: discordInfo?.inviteCode || null
        }));
      }

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

      handleCloseModal();
      showToast("Material compartido con éxito", "success");
      if (selectedSubject) fetchMaterials(selectedSubject._id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mensaje?: string, error?: { message?: string } } } };
      const apiError = axiosErr.response?.data?.mensaje || axiosErr.response?.data?.error?.message;
      const errorMsg = err instanceof Error ? err.message : "No se pudo compartir el material";
      showToast(apiError || errorMsg, "error");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAction = (material: Material) => {
    if (material.suspendido && !isAdmin) {
      alert("Este material se encuentra suspendido temporalmente por denuncias de la comunidad.");
      return;
    }

    const url = resolveMaterialUrl(material.url, material.tipo);
    if (!url) {
      alert("Este material no tiene un archivo o enlace disponible.");
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredSubjects = subjects.filter(s => 
    s.nombre.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.codigo.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <div className="materials-container">
      <Toast toast={toast} onClose={hideToast} />

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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {selectedSubject ? `Repositorio: ${selectedSubject.nombre}` : "Materiales de Estudio"}
              {!selectedSubject && (
                <span style={{ padding: '2px 10px', borderRadius: 999, background: '#dbeafe', color: '#1e40af', fontSize: 13, fontWeight: 500 }}>
                  Total Materias: {subjects.length}
                </span>
              )}
            </h2>
            <p>{selectedSubject
              ? `Recursos compartidos para esta materia: ${(materialCounts[selectedSubject._id] || 0) === 0 ? 'Ninguno' : (materialCounts[selectedSubject._id] || 0)}`
              : "Selecciona una materia para ver su repositorio"}</p>
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
            placeholder={selectedSubject ? "Buscar material por nombre o tag..." : "Buscar materia..."}
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
            <option value="alfabetico">A - Z (alfabético)</option>
          </select>

          <span className="sort-label">Filtrar por:</span>
          <select
            className="sort-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="propios">Propios</option>
            <option value="amigos">Amigos</option>
            <option value="denunciados">Denunciados</option>
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
              {filteredSubjects.map((s) => {
                const count = materialCounts[s._id] || 0;
                const badge = count === 0
                  ? { text: 'Vacío', bg: '#e5e7eb', color: '#4b5563' }
                  : { text: `Materiales: ${count > 99 ? '99+' : count}`, bg: '#dbeafe', color: '#1e40af' };
                return (
                  <div key={s._id} className="repository-card" onClick={() => setSelectedSubject(s)}>
                    <div className="repo-icon">📚</div>
                    <div className="repo-info">
                      <h3>{s.nombre}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="repo-code">{s.codigo}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 999, background: badge.bg, color: badge.color, fontSize: 12, fontWeight: 500 }}>
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    <div className="repo-arrow">→</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* VISTA DE MATERIALES DEL REPOSITORIO SELECCIONADO */
        <div className="materials-list">
          {materials.length === 0 ? (
            <div className="no-results py-10 text-center">
              {filterBy === 'denunciados' ? (
                <>No hay materiales denunciados en esta materia.</>
              ) : filterBy === 'amigos' ? (
                <>No hay materiales de tus contactos en esta materia.</>
              ) : (
                <>
                  No hay materiales compartidos en esta materia todavía. <br />
                  ¡Sé el primero en compartir algo!
                </>
              )}
            </div>
          ) : (
            materials.map((m) => {
              const iconDisplay = getMaterialIconDisplay(m);
              const platformClass = getPlatformCardClass(iconDisplay);
              return (
              <div key={m._id} className={`material-card ${m.suspendido ? 'is-suspended' : ''} ${platformClass}`}>
                {canDeleteMaterial(m) && (!m.suspendido || isAdmin) && (
                  <button
                    type="button"
                    className="btn-delete-material"
                    onClick={() => openDeleteModal(m)}
                    title="Eliminar material"
                    aria-label="Eliminar material"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="material-top">
                  <MaterialCategoryIcon display={iconDisplay} />

                  <div className="material-info">
                    <div className="title-row">
                      <h4>{m.titulo}</h4>
                      {m.suspendido && <span className="suspended-badge">Suspendido</span>}
                    </div>
                    <p className="material-desc">{m.descripcion || "Sin descripción"}</p>
                    {m.categoria === 'discord' && m.discordMetadata && (
                      <div className="discord-metadata-display">
                        {m.discordMetadata.serverName && (
                          <div className="discord-server-row">
                            <span className="discord-server-icon">💬</span>
                            <span className="discord-server-name">{m.discordMetadata.serverName}</span>
                          </div>
                        )}
                        {m.discordMetadata.channelName && (
                          <div className="discord-channel-row">
                            <span className="discord-hash">#</span>
                            <span className="discord-channel-name">{m.discordMetadata.channelName}</span>
                          </div>
                        )}
                        {m.discordMetadata.channelDescription && (
                          <p className="discord-channel-desc">{m.discordMetadata.channelDescription}</p>
                        )}
                        {m.discordMetadata.memberCount != null && (
                          <span className="discord-member-count">👥 {m.discordMetadata.memberCount} miembros</span>
                        )}
                      </div>
                    )}
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
                        <span>Ratio:</span>
                        <div
                          className="ratio-bar"
                          role="img"
                          aria-label={`${m.likes || 0} positivos, ${m.dislikes || 0} negativos`}
                        >
                          <div
                            className="ratio-bar-likes"
                            style={{ width: `${((m.likes || 0) / m.totalValoraciones) * 100}%` }}
                          />
                          <div
                            className="ratio-bar-dislikes"
                            style={{ width: `${((m.dislikes || 0) / m.totalValoraciones) * 100}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="material-footer">
                  <div className="author-meta">
                    Por {m.autor?.nombre || 'Usuario'} <br />
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Sin fecha'}
                  </div>

                  {!m.suspendido && (
                  <div className="action-buttons">
                    {!esAutor(m) && (
                    <button
                      className="btn-report"
                      onClick={() => handleOpenReportModal(m)}
                      disabled={m.userReported}
                      title={m.userReported
                        ? "Ya denunciaste este material. Solo podés denunciarlo una vez."
                        : "Denunciar contenido inapropiado"}
                    >
                      🚩
                    </button>
                    )}
                    <button 
                      className={`btn-primary ${m.categoria === 'discord' ? 'discord-btn' : ''}`}
                      onClick={() => handleAction(m)}
                    >
                      {m.categoria === 'discord' ? 'Unirse' : (m.tipo === 'archivo' ? 'Descargar' : 'Ver Recurso')}
                    </button>
                  </div>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {materialToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <Trash2 size={28} />
            </div>
            <h3 className="delete-modal-title">¿Eliminar material?</h3>
            <p className="delete-modal-text">
              Vas a eliminar <strong>{materialToDelete.titulo}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
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
              <p className="modal-subtitle">
                Material: <strong>{selectedMaterial?.titulo}</strong>
              </p>

              <div className="form-group">
                <label>Motivos de la denuncia * (podés seleccionar más de uno)</label>
                <div className={`report-reasons-dropdown ${reasonsDropdownOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="report-reasons-trigger"
                    onClick={() => setReasonsDropdownOpen(o => !o)}
                  >
                    <span>
                      {reportData.reasonIds.length === 0
                        ? 'Seleccionar motivos'
                        : `${reportData.reasonIds.length} motivo${reportData.reasonIds.length > 1 ? 's' : ''} seleccionado${reportData.reasonIds.length > 1 ? 's' : ''}`}
                    </span>
                    <span className="report-reasons-caret">▾</span>
                  </button>
                  {reasonsDropdownOpen && (
                    <div className="report-reasons-panel">
                      {reasons.map(r => (
                        <label key={r._id} className="report-reason-option">
                          <input
                            type="checkbox"
                            checked={reportData.reasonIds.includes(r._id)}
                            onChange={() => handleReasonToggle(r._id)}
                          />
                          <span>{r.titulo}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {reasons.some(r => reportData.reasonIds.includes(r._id) && r.titulo.toLowerCase() === 'otro') && (
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
                <SearchableSelect
                  options={subjects.map(s => ({ value: s._id, label: `${s.nombre} (${s.codigo})` }))}
                  value={formData.materia}
                  onChange={(value) => setFormData(prev => ({ ...prev, materia: value }))}
                  placeholder="Escribí o seleccioná una materia..."
                />
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
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      id="file-upload-input"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload-input" className="file-upload-label">
                      <span className="file-upload-icon">📁</span>
                      <span>{selectedFile ? selectedFile.name : "Seleccionar archivo"}</span>
                    </label>
                    {selectedFile && (
                      <div className="file-upload-details">
                        <span className="file-upload-size">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        <button 
                          type="button" 
                          className="file-upload-clear"
                          onClick={() => {
                            setSelectedFile(null);
                            const input = document.getElementById('file-upload-input') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>URL del material *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        name="url"
                        value={formData.url || ""}
                        onChange={handleInputChange}
                        onBlur={handleDiscordUrlBlur}
                        placeholder="https://..."
                        required={formData.tipo === "link"}
                        style={{ flex: 1 }}
                      />
                      {formData.categoria === "discord" && (
                        <button
                          type="button"
                          className="btn-discord-info"
                          onClick={() => fetchDiscordInfo()}
                          disabled={discordInfoLoading || !formData.url}
                        >
                          {discordInfoLoading ? "..." : "🔍"}
                        </button>
                      )}
                    </div>
                  </div>

                  {formData.categoria === "discord" && (
                    <div className="discord-extra-fields">
                      <div className="discord-invite-preview">
                        <div className="discord-invite-top">
                          <span className="discord-badge">DISCORD</span>
                          {discordInfo?.memberCount != null && (
                            <span className="discord-invite-members">
                              <span className="discord-invite-dot" aria-hidden="true" />
                              {discordInfo.memberCount} miembros
                            </span>
                          )}
                        </div>
                        <div className="discord-invite-body">
                          <div className="discord-invite-avatar">
                            {discordServerName ? discordServerName.charAt(0).toUpperCase() : "#"}
                          </div>
                          <div className="discord-invite-info">
                            <span className="discord-invite-header">Invitación a un servidor</span>
                            <span className="discord-invite-server">
                              {discordServerName || "Servidor de Discord"}
                            </span>
                            {discordChannelName && (
                              <span className="discord-invite-channel">
                                <span className="discord-invite-hash">#</span>{discordChannelName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Nombre del servidor *</label>
                        <input 
                          type="text" 
                          value={discordServerName} 
                          onChange={(e) => setDiscordServerName(e.target.value)}
                          placeholder="Ej: Servidor de Programación"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Canal *</label>
                        <input 
                          type="text" 
                          value={discordChannelName} 
                          onChange={(e) => setDiscordChannelName(e.target.value)}
                          placeholder="Ej: general"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Descripción del canal / servidor</label>
                        <textarea 
                          value={discordChannelDescription} 
                          onChange={(e) => setDiscordChannelDescription(e.target.value)}
                          placeholder="¿De qué trata este servidor/canal?"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </>
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
