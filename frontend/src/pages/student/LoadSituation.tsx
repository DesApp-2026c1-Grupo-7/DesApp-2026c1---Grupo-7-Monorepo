import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, ListPlus } from "lucide-react";
import api from "../../services/api";
import "../../styles/LoadSituation.css";
import "../../styles/Profile.css";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
}

interface ManualRow {
  materiaId: string;
  estado: string;
  nota: string;
  cuatrimestre: number;
  anioCursada: number;
}

interface PreviewRow {
  fila: number;
  codigo: string;
  materiaId?: string;
  materiaNombre?: string;
  estado: string;
  nota?: number;
  cuatrimestre?: number;
  anioCursada?: number;
  errores: string[];
}

const ESTADOS = ["Pendiente", "Inscripto", "Cursando", "Regular", "Aprobada", "Promocion", "Libre"];
const currentYear = new Date().getFullYear();

const LoadSituation = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mode, setMode] = useState<"none" | "manual" | "excel">("none");
  const [rows, setRows] = useState<ManualRow[]>([{
    materiaId: "", estado: "Aprobada", nota: "", cuatrimestre: 1, anioCursada: currentYear
  }]);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), message.type === "success" ? 4000 : 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    api.get("/academico/pendientes").then((r) => setSubjects(r.data)).catch(() => {});
  }, []);

  const updateRow = (idx: number, key: keyof ManualRow, value: string | number) => {
    setRows((prev) => prev.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  const updatePreview = (idx: number, key: keyof PreviewRow, value: string | number) => {
    setPreview((prev) => prev.map((row, i) => {
      if (i !== idx) return row;
      const next = { ...row, [key]: value, errores: [] };
      if (key === "materiaId") {
        const subject = subjects.find((s) => s._id === value);
        next.codigo = subject?.codigo || row.codigo;
        next.materiaNombre = subject?.nombre;
      }
      return next;
    }));
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const records = rows
        .filter((row) => row.materiaId)
        .map((row) => ({
          materiaId: row.materiaId,
          estado: row.estado,
          nota: row.nota ? Number(row.nota) : undefined,
          cuatrimestre: Number(row.cuatrimestre),
          anioCursada: Number(row.anioCursada)
        }));
      if (records.length === 0) {
        setMessage({ text: "Agregá al menos una materia.", type: "error" });
        return;
      }
      const res = await api.post("/academico/situacion/bulk", { records });
      setMessage({ text: res.data.mensaje, type: "success" });
      window.setTimeout(() => navigate("/student/situation"), 1000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setMessage({ text: ax.response?.data?.mensaje || "Error al cargar la situación", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const previewExcel = async (file: File) => {
    setMessage(null);
    setPreview([]);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/academico/situacion/preview-excel", fd);
      setPreview(res.data.preview);
      setMessage({ text: res.data.mensaje, type: "success" });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setMessage({ text: ax.response?.data?.mensaje || "Error al generar preview", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const confirmPreview = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await api.post("/academico/situacion/confirm-excel", { records: preview });
      setMessage({ text: res.data.mensaje, type: "success" });
      window.setTimeout(() => navigate("/student/situation"), 1000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setMessage({ text: ax.response?.data?.mensaje || "Error al confirmar la importación", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Usamos punto y coma para mejor compatibilidad con Excel (especialmente en locales en español)
    // y agregamos el BOM de UTF-8 (\ufeff) para que Excel reconozca correctamente los caracteres especiales.
    const csvContent = [
      "codigo;estado;nota;cuatrimestre;anio",
      "AM1;Aprobada;9;1;2024",
      "AED;Regular;;2;2024"
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-situacion-academica.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="load-situation">
      <button className="back" type="button" onClick={() => navigate("/student/situation")}>
        <ArrowLeft size={16} /> Volver al historial
      </button>
      <h1>Cargar Situación Académica</h1>
      <p className="subtitle">Carga manual o importación con vista previa y corrección antes de confirmar.</p>

      {message && (
        <div className={`profile-alert ${message.type}`} role={message.type === "success" ? "status" : "alert"}>
          <span className="profile-alert__icon" aria-hidden="true">
            {message.type === "success" ? "✓" : "!"}
          </span>
          <span className="profile-alert__message">{message.text}</span>
          <button className="profile-alert__close" onClick={() => setMessage(null)} aria-label="Cerrar">×</button>
        </div>
      )}

      <div className="options">
        <button type="button" className={`option-card ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>
          <div className="icon blue"><ListPlus size={28} /></div>
          <h3>Carga manual</h3>
          <p>Ingresá materias una por una.</p>
        </button>
        <button type="button" className={`option-card ${mode === "excel" ? "active" : ""}`} onClick={() => setMode("excel")}>
          <div className="icon green"><FileSpreadsheet size={28} /></div>
          <h3>Subir Excel</h3>
          <p>Generá la vista previa, corregí filas y confirmá.</p>
        </button>
      </div>

      {mode === "manual" && (
        <form onSubmit={submitManual} className="manual-form">
          <h3>Carga manual</h3>
          <div className="manual-rows">
            {rows.map((row, idx) => (
              <div key={idx} className="manual-row">
                <select 
                  className="subject-select"
                  aria-label={`Materia de la fila ${idx + 1}`}
                  value={row.materiaId} 
                  onChange={(e) => updateRow(idx, "materiaId", e.target.value)}
                >
                  <option value="">-- Materia --</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.nombre} ({subject.codigo})
                    </option>
                  ))}
                </select>
                <select 
                  className="status-select"
                  aria-label={`Estado de la fila ${idx + 1}`}
                  value={row.estado} 
                  onChange={(e) => updateRow(idx, "estado", e.target.value)}
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  className="grade-input"
                  aria-label={`Nota de la fila ${idx + 1}`}
                  min={0} 
                  max={10} 
                  placeholder="Nota" 
                  value={row.nota} 
                  onChange={(e) => updateRow(idx, "nota", e.target.value)} 
                />
                <select 
                  className="term-select"
                  aria-label={`Período de la fila ${idx + 1}`}
                  value={row.cuatrimestre} 
                  onChange={(e) => updateRow(idx, "cuatrimestre", Number(e.target.value))}
                >
                  <option value={0}>Anual</option>
                  <option value={1}>1C</option>
                  <option value={2}>2C</option>
                </select>
                <input 
                  type="number" 
                  className="year-input"
                  aria-label={`Año de cursada de la fila ${idx + 1}`}
                  value={row.anioCursada} 
                  onChange={(e) => updateRow(idx, "anioCursada", Number(e.target.value))} 
                />
                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <div className="manual-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setRows((prev) => [...prev, { materiaId: "", estado: "Aprobada", nota: "", cuatrimestre: 1, anioCursada: currentYear }])}
            >
              Agregar fila
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              Guardar
            </button>
          </div>
        </form>
      )}

      {mode === "excel" && (
        <div className="excel-import-container">
          <h3>Importar Excel/CSV</h3>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) previewExcel(file);
            }}
          />
          <div className="excel-actions">
            <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              {loading ? "Procesando..." : "Seleccionar archivo"}
            </button>
            <button type="button" className="btn-secondary" onClick={downloadTemplate}>
              Descargar plantilla
            </button>
          </div>

          {preview.length > 0 && (
            <div className="preview-container">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Materia</th>
                      <th>Estado</th>
                      <th>Nota</th>
                      <th>Cuatri</th>
                      <th>Anio</th>
                      <th>Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={row.fila}>
                        <td>{row.fila}</td>
                        <td>
                          <select value={row.materiaId || ""} onChange={(e) => updatePreview(idx, "materiaId", e.target.value)}>
                            <option value="">-- Corregir materia --</option>
                            {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.nombre} ({subject.codigo})</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={row.estado} onChange={(e) => updatePreview(idx, "estado", e.target.value)}>
                            {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                          </select>
                        </td>
                        <td><input type="number" min={0} max={10} value={row.nota ?? ""} onChange={(e) => updatePreview(idx, "nota", Number(e.target.value))} /></td>
                        <td><input type="number" min={0} max={2} value={row.cuatrimestre ?? ""} onChange={(e) => updatePreview(idx, "cuatrimestre", Number(e.target.value))} /></td>
                        <td><input type="number" value={row.anioCursada ?? ""} onChange={(e) => updatePreview(idx, "anioCursada", Number(e.target.value))} /></td>
                        <td className={row.errores.length ? "error-text" : "ok-text"}>
                          {row.errores.join("; ") || "OK"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn-primary" onClick={confirmPreview} disabled={loading} style={{ marginTop: 12 }}>
                Confirmar importación
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadSituation;
