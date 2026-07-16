import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import "../../styles/Moderation.css";
import { resolveMaterialUrl } from "../../utils/materialUrl";
import { Flag, CheckCircle, XCircle, Eye, AlertCircle, Settings, Save, ExternalLink } from "lucide-react";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

interface Report {
  _id: string;
  material: {
    _id: string;
    titulo: string;
    descripcion: string;
    materia: { nombre: string; codigo: string };
    autor: { nombre: string; email: string };
    url: string;
    nombreOriginal?: string;
    tipo: string;
    categoria: string;
    mimetype?: string;
    tags: string[];
    createdAt: string;
    suspendido?: boolean;
    pendingReports?: number;
    verifiedReports?: number;
  };
  denunciante: {
    nombre: string;
    email: string;
  };
  motivo: { titulo: string }[];
  motivoEspecifico?: string;
  detalle: string;
  estado: 'pendiente' | 'revisado' | 'ignorado';
  resolucion?: string;
  createdAt: string;
}

interface ReportConfig {
  nPending: number;
  mVerified: number;
}

export default function Moderation() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();
  const [filterStatus, setFilterStatus] = useState("todos");
  
  // Detalle de material
  const [selectedMaterial, setSelectedMaterial] = useState<Report['material'] | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  
  // Configuración de umbrales
  const [config, setConfig] = useState<ReportConfig>({ nPending: 3, mVerified: 1 });
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/denuncias");
      setReports(res.data);
    } catch (err) {
      console.error("Error al cargar denuncias", err);
      showToast("No se pudieron cargar las denuncias", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get("/denuncias/config");
      setConfig(res.data);
    } catch (err) {
      console.error("Error al cargar configuración", err);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchReports();
      await fetchConfig();
    };
    loadInitialData();
  }, [fetchReports, fetchConfig]);

  const handleUpdateStatus = async (reportId: string, nuevoEstado: string) => {
    try {
      const resolucion = nuevoEstado === 'revisado' 
        ? "Denuncia confirmada." 
        : "Denuncia rechazada.";
        
      await api.patch(`/denuncias/${reportId}/status`, {
        estado: nuevoEstado,
        resolucion
      });

      fetchReports();
      showToast(
        nuevoEstado === 'revisado' ? "Denuncia confirmada con éxito" : "Denuncia rechazada",
        "success"
      );
    } catch (err) {
      console.error("Error al actualizar denuncia", err);
      showToast("No se pudo actualizar el estado de la denuncia", "error");
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await api.patch("/denuncias/config", config);
      setShowConfig(false);
      showToast("Configuración actualizada correctamente", "success");
    } catch (err) {
      console.error("Error al guardar configuración", err);
      showToast("No se pudo guardar la configuración", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const openMaterialModal = (material: Report['material']) => {
    setSelectedMaterial(material);
    setIsMaterialModalOpen(true);
  };

  const filteredReports = reports.filter(r => 
    filterStatus === "todos" || r.estado === filterStatus
  );

  const pendingCount = reports.filter(r => r.estado === 'pendiente').length;
  const resolvedCount = reports.filter(r => r.estado === 'revisado').length;
  const ignoredCount = reports.filter(r => r.estado === 'ignorado').length;

  const handleViewContent = (material: Report['material']) => {
    const url = resolveMaterialUrl(material.url, material.tipo);
    if (!url) {
      alert("Este material no tiene un archivo o enlace disponible.");
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getSimplifiedFileType = (material: Report['material']) => {
    if (material.tipo !== 'archivo') return material.categoria;
    
    if (material.nombreOriginal) {
      const ext = material.nombreOriginal.split('.').pop()?.toLowerCase();
      if (ext) return ext;
    }

    if (material.mimetype) {
      if (material.mimetype.includes('pdf')) return 'pdf';
      if (material.mimetype.includes('zip')) return 'zip';
      if (material.mimetype.includes('word') || material.mimetype.includes('officedocument.wordprocessingml')) return 'docx';
      if (material.mimetype.includes('presentation') || material.mimetype.includes('powerpoint')) return 'pptx';
      if (material.mimetype.includes('spreadsheet') || material.mimetype.includes('excel')) return 'xlsx';
      if (material.mimetype.includes('image/')) return material.mimetype.split('/')[1];
    }

    return 'archivo';
  };

  return (
    <div className="moderation-container">
      <Toast toast={toast} onClose={hideToast} />

      <div className="moderation-header">
        <div>
          <h1>Panel de Moderación</h1>
          <p className="subtitle">
            Gestiona denuncias y contenido reportado
          </p>
        </div>
        <button 
          className={`btn-config ${showConfig ? 'active' : ''}`}
          onClick={() => setShowConfig(!showConfig)}
        >
          <Settings size={20} />
          Configuración
        </button>
      </div>

      {/* CONFIGURACIÓN DE UMBRALES */}
      {showConfig && (
        <div className="config-panel">
          <h3>Umbrales de Suspensión Automática</h3>
          <p className="config-desc">
            Define cuántas denuncias debe recibir un material para ser suspendido automáticamente.
          </p>
          <div className="config-grid">
            <div className="config-item">
              <label>Denuncias Pendientes necesarias para suspensión</label>
              <input 
                type="number" 
                value={config.nPending} 
                onChange={(e) => setConfig({...config, nPending: parseInt(e.target.value) || 0})}
              />
              <small>Suspensión preventiva si supera este número de denuncias aún no revisadas.</small>
            </div>
            <div className="config-item">
              <label>Denuncias Verificadas necesarias para suspensión</label>
              <input 
                type="number" 
                value={config.mVerified} 
                onChange={(e) => setConfig({...config, mVerified: parseInt(e.target.value) || 0})}
              />
              <small>Suspensión definitiva si supera este número de denuncias marcadas como revisadas.</small>
            </div>
          </div>
          <div className="config-actions">
            <button className="btn-save" onClick={handleSaveConfig} disabled={savingConfig}>
              <Save size={18} />
              {savingConfig ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      )}

      {/* RESUMEN */}
      <div className="stats">
        <div className="stat-card warning">
          <Flag />
          <div>
            <h2>{pendingCount}</h2>
            <p>Denuncias Pendientes</p>
          </div>
        </div>

        <div className="stat-card success">
          <CheckCircle />
          <div>
            <h2>{resolvedCount}</h2>
            <p>Denuncias Aceptadas</p>
          </div>
        </div>

        <div className="stat-card danger">
          <XCircle />
          <div>
            <h2>{ignoredCount}</h2>
            <p>Denuncias Rechazadas</p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="revisado">Revisadas</option>
          <option value="ignorado">Ignoradas</option>
        </select>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="text-center py-10">Cargando denuncias...</div>
      ) : (
        <div className="reports">
          {filteredReports.length === 0 ? (
            <div className="no-results py-10 text-center">No hay denuncias que coincidan con el filtro.</div>
          ) : (
            filteredReports.map((r) => (
              <div key={r._id} className={`report-card status-${r.estado}`}>
                <div className="report-header">
                  <div className="tags">
                    <span className="tag tipo">Material</span>
                    <span className={`tag estado state-${r.estado}`}>{r.estado}</span>
                  </div>
                  <span className="fecha">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="report-title-row">
                  <div className="title-group">
                    <h3>{r.material?.titulo || "Material Eliminado"}</h3>
                    {r.material?.suspendido && <span className="tag-suspended">Actualmente Suspendido</span>}
                  </div>
                  {r.material && (
                    <button className="btn-view-material" onClick={() => openMaterialModal(r.material)}>
                      <Eye size={16} /> Evaluar Contenido
                    </button>
                  )}
                </div>

                <p className="motivo">
                  <strong>{r.motivo?.length > 1 ? 'Motivos:' : 'Motivo:'}</strong>{' '}
                  {r.motivo?.map(m => m.titulo).join(', ')}
                  {r.motivoEspecifico && ` - ${r.motivoEspecifico}`}
                </p>
                <div className="report-detail">
                  <AlertCircle size={16} />
                  <p>{r.detalle}</p>
                </div>

                <div className="report-info">
                  <div>
                    <small>Reportado por</small>
                    <p>{r.denunciante?.nombre || "Usuario"} ({r.denunciante?.email})</p>
                  </div>
                </div>

                {r.resolucion && (
                  <div className="resolucion-box">
                    <strong>Resolución:</strong> {r.resolucion}
                  </div>
                )}

                {r.estado === 'pendiente' && (
                  <div className="actions">
                    <div className="right-actions">
                      <button 
                        className="btn-danger"
                        onClick={() => handleUpdateStatus(r._id, 'ignorado')}
                      >
                        <XCircle size={16} /> Rechazar Denuncia
                      </button>
                      <button 
                        className="btn-success"
                        onClick={() => handleUpdateStatus(r._id, 'revisado')}
                      >
                        <CheckCircle size={16} /> Confirmar Denuncia
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DE EVALUACIÓN DE MATERIAL */}
      {isMaterialModalOpen && selectedMaterial && (
        <div className="modal-overlay">
          <div className="modal-content material-eval-modal">
            <div className="modal-header">
              <h3>Detalle del Material para Evaluación</h3>
              <button className="close-button" onClick={() => setIsMaterialModalOpen(false)}>&times;</button>
            </div>
            
            <div className="eval-content">
              <div className="eval-section">
                <label>Título:</label>
                <p>{selectedMaterial.titulo}</p>
              </div>
              
              <div className="eval-section">
                <label>Descripción:</label>
                <p>{selectedMaterial.descripcion || "Sin descripción"}</p>
              </div>
              
              <div className="eval-grid">
                <div className="eval-section">
                  <label>Materia:</label>
                  <p>{selectedMaterial.materia.nombre} ({selectedMaterial.materia.codigo})</p>
                </div>
                <div className="eval-section">
                  <label>Autor:</label>
                  <p>{selectedMaterial.autor.nombre} ({selectedMaterial.autor.email})</p>
                </div>
                <div className="eval-section">
                  <label>Tipo:</label>
                  <p>
                    {selectedMaterial.tipo === 'archivo' 
                      ? `Archivo: ${getSimplifiedFileType(selectedMaterial)}` 
                      : `Link: ${selectedMaterial.categoria}`}
                  </p>
                </div>
                <div className="eval-section">
                  <label>Fecha de publicación:</label>
                  <p>{new Date(selectedMaterial.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="eval-section">
                <label>Tags:</label>
                <div className="eval-tags">
                  {selectedMaterial.tags.map((t, i) => <span key={i} className="eval-tag">#{t}</span>)}
                </div>
              </div>

              <div className="eval-actions">
                <button className="btn-primary btn-access" onClick={() => handleViewContent(selectedMaterial)}>
                  <ExternalLink size={18} /> Acceder al Contenido Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
