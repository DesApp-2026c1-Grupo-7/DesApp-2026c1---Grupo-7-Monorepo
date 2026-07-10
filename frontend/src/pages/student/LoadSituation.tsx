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
  nota: string;
  cuatrimestre: number;
  anioCursada: number;
  errores: string[];
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

const previewEstado = (nota: string | number | undefined | null): string => {
  const n = typeof nota === 'string' ? Number(nota) : (nota ?? NaN);
  if (isNaN(n)) return "Cursando";
  if (n >= 1 && n <= 3) return "Desaprobado";
  if (n > 3 && n <= 6) return "Regular";
  if (n > 6 && n <= 10) return "Promocion";
  return "Cursando";
};
const currentYear = new Date().getFullYear();

const LoadSituation = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mode, setMode] = useState<"none" | "manual" | "excel">("none");
  const [rows, setRows] = useState<ManualRow[]>([{
    materiaId: "", nota: "", cuatrimestre: 1, anioCursada: currentYear, errores: []
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
    setRows((prev) => prev.map((row, i) => {
      if (i !== idx) return row;
      const errores: string[] = [];
      const next = { ...row, [key]: value, errores };
      if (key === "nota" && value !== "" && value !== undefined && value !== null) {
        const notaNum = Number(value);
        if (notaNum < 1 || notaNum > 10) {
          errores.push("Nota invalida (debe ser 1-10)");
        }
      }
      return next;
    }));
  };

  const updatePreview = (idx: number, key: keyof PreviewRow, value: string | number) => {
    setPreview((prev) => prev.map((row, i) => {
      if (i !== idx) return row;
      const errores: string[] = [];
      const next = { ...row, [key]: value, errores };
      if (key === "materiaId") {
        const subject = subjects.find((s) => s._id === value);
        if (subject) {
          next.codigo = subject.codigo;
          next.materiaNombre = subject.nombre;
        }
      }
      if (key === "nota") {
        const notaNum = typeof value === 'string' ? Number(value) : value;
        next.estado = previewEstado(notaNum);
        if (value !== "" && value !== undefined && value !== null && (notaNum < 1 || notaNum > 10)) {
          errores.push("Nota invalida (debe ser 1-10)");
        }
      }
      return next;
    }));
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const inlineErrors = rows.some((r) => r.errores.length > 0);
    if (inlineErrors) return;

    setLoading(true);
    try {
      const records = rows
        .filter((row) => row.materiaId)
        .map((row, idx) => ({
          fila: idx + 1,
          materiaId: row.materiaId,
          nota: row.nota ? Number(row.nota) : undefined,
          cuatrimestre: Number(row.cuatrimestre),
          anioCursada: Number(row.anioCursada)
        }));
      if (records.length === 0) {
        setMessage({ text: "Agregá al menos una materia.", type: "error" });
        return;
      }
      const res = await api.post("/academico/situacion/bulk", { records });
      const { mensaje, errores } = res.data as { mensaje: string; errores?: { fila: number; motivo: string }[] };
      if (errores && errores.length > 0) {
        const errorMap = new Map(errores.map((e: { fila: number; motivo: string }) => [e.fila, e.motivo]));
        setRows((prev) => prev.map((row, idx) => ({
          ...row,
          errores: errorMap.has(idx + 1) ? [errorMap.get(idx + 1) ?? ''] : []
        })));
      } else {
        setMessage({ text: mensaje || "Carga completada", type: "success" });
        window.setTimeout(() => navigate("/student/situation"), 1500);
      }
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
      const { procesados, errores, mensaje } = res.data as { procesados: unknown[]; errores?: { fila: number; motivo: string }[]; mensaje: string };

      if (errores && errores.length > 0) {
        const errorMap = new Map(errores.map((e: { fila: number; motivo: string }) => [e.fila, e.motivo]));
        setPreview((prev) => prev.map((row) => ({
          ...row,
          errores: errorMap.has(row.fila) ? [errorMap.get(row.fila) ?? ''] : row.errores
        })));
        setMessage({
          text: `${procesados.length} registros importados. ${errores.length} errores. Corregí las filas marcadas y confirmá de nuevo.`,
          type: "error"
        });
      } else {
        setMessage({ text: mensaje || "Importación completada", type: "success" });
        window.setTimeout(() => navigate("/student/situation"), 1500);
      }
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
    // El estado se calcula automáticamente según la nota: 1-3 → Desaprobado, 4-6 → Regular, 7-10 → Promocion.
    // Si no se especifica nota, queda como Cursando (ej: materia en curso sin nota final).
    const csvContent = [
      "codigo;nota;cuatrimestre;año",
      "MAT;9;1;2024",
      "IP;6;1;2024",
      "ING1;3;1;2024",
      "PROG1;;2;2024"
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
          <div className="table-responsive manual-table">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Materia</th>
                  <th>Estado</th>
                  <th>Nota</th>
                  <th>Cuatri</th>
                  <th>Año</th>
                  <th>Errores</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td data-label="Fila">{idx + 1}</td>
                    <td data-label="Materia">
                      <select value={row.materiaId} onChange={(e) => updateRow(idx, "materiaId", e.target.value)}>
                        <option value="">-- Materia --</option>
                        {subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>{subject.nombre} ({subject.codigo})</option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Estado">
                      <span className={`status-badge ${previewEstado(row.nota).toLowerCase()}`}>{previewEstado(row.nota)}</span>
                    </td>
                    <td data-label="Nota">
                      <input type="number" placeholder="Nota" value={row.nota} onChange={(e) => updateRow(idx, "nota", e.target.value)} />
                    </td>
                    <td data-label="Cuatri">
                      <select value={row.cuatrimestre} onChange={(e) => updateRow(idx, "cuatrimestre", Number(e.target.value))}>
                        <option value={0}>Anual</option>
                        <option value={1}>1C</option>
                        <option value={2}>2C</option>
                      </select>
                    </td>
                    <td data-label="Año">
                      <input type="number" value={row.anioCursada} onChange={(e) => updateRow(idx, "anioCursada", Number(e.target.value))} />
                    </td>
                    <td data-label="Errores" className={row.errores.length ? "error-text" : "ok-text"}>
                      {row.errores.join("; ") || "OK"}
                    </td>
                    <td data-label="">
                      <button type="button" className="btn-remove" onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}>Quitar fila</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="confirm-bar">
            <button type="button" className="btn-secondary" onClick={() => setRows((prev) => [...prev, { materiaId: "", nota: "", cuatrimestre: 1, anioCursada: currentYear, errores: [] }])}>
              Agregar fila
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
            {rows.some((r) => r.errores.length > 0) && (
              <span className="error-count">{rows.filter((r) => r.errores.length > 0).length} fila(s) con errores</span>
            )}
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
                      <th>Año</th>
                      <th>Errores</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={row.fila}>
                        <td data-label="Fila">{row.fila}</td>
                        <td data-label="Materia">
                          <select value={row.materiaId || ""} onChange={(e) => updatePreview(idx, "materiaId", e.target.value)}>
                            <option value="">-- Materia --</option>
                            {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.nombre} ({subject.codigo})</option>)}
                          </select>
                        </td>
                        <td data-label="Estado">
                          <span className={`status-badge ${previewEstado(row.nota).toLowerCase()}`}>{previewEstado(row.nota)}</span>
                        </td>
                        <td data-label="Nota"><input type="number" value={row.nota ?? ""} onChange={(e) => updatePreview(idx, "nota", Number(e.target.value))} /></td>
                        <td data-label="Cuatri"><input type="number" min={0} max={2} value={row.cuatrimestre ?? ""} onChange={(e) => updatePreview(idx, "cuatrimestre", Number(e.target.value))} /></td>
                        <td data-label="Año"><input type="number" value={row.anioCursada ?? ""} onChange={(e) => updatePreview(idx, "anioCursada", Number(e.target.value))} /></td>
                        <td data-label="Errores" className={row.errores.length ? "error-text" : "ok-text"}>
                          {row.errores.join("; ") || "OK"}
                        </td>
                        <td data-label="">
                          <button type="button" className="btn-remove" onClick={() => setPreview((prev) => prev.filter((_, i) => i !== idx))}>Quitar fila</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="confirm-bar">
                <button type="button" className="btn-secondary" onClick={() => {
                  const maxFila = preview.reduce((m, r) => Math.max(m, r.fila), 0);
                  setPreview((prev) => [...prev, {
                    fila: maxFila + 1, codigo: "", estado: "Cursando", errores: []
                  }]);
                }}>
                  Agregar fila
                </button>
                <button className="btn-primary" onClick={confirmPreview} disabled={loading}>
                  {loading ? "Confirmando..." : "Confirmar importación"}
                </button>
                {preview.some((r) => r.errores.length > 0) && (
                  <span className="error-count">{preview.filter((r) => r.errores.length > 0).length} fila(s) con errores</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadSituation;
