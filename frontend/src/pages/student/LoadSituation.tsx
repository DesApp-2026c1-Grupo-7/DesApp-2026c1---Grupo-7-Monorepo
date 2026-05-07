import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/LoadSituation.css";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/materias").then((r) => setSubjects(r.data)).catch(() => {});
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
    setError("");
    setSuccess("");
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
        setError("Agrega al menos una materia.");
        return;
      }
      const res = await api.post("/academico/situacion/bulk", { records });
      setSuccess(res.data.mensaje);
      window.setTimeout(() => navigate("/student/situation"), 1000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al cargar la situacion");
    } finally {
      setLoading(false);
    }
  };

  const previewExcel = async (file: File) => {
    setError("");
    setSuccess("");
    setPreview([]);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/academico/situacion/preview-excel", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPreview(res.data.preview);
      setSuccess(res.data.mensaje);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al generar preview");
    } finally {
      setLoading(false);
    }
  };

  const confirmPreview = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.post("/academico/situacion/confirm-excel", { records: preview });
      setSuccess(res.data.mensaje);
      window.setTimeout(() => navigate("/student/situation"), 1000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al confirmar importacion");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = ["codigo,estado,nota,cuatrimestre,anio", "ALG,Aprobada,9,1,2026"].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-situacion-academica.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="load-situation">
      <span className="back" onClick={() => navigate("/student/situation")}>Volver al historial</span>
      <h1>Cargar Situacion Academica</h1>
      <p className="subtitle">Carga manual o importacion con preview y correccion antes de confirmar.</p>

      {error && <div style={{ padding: 12, background: "#fee", color: "#c33", borderRadius: 8 }}>{error}</div>}
      {success && <div style={{ padding: 12, background: "#dfd", color: "#363", borderRadius: 8 }}>{success}</div>}

      <div className="options">
        <div className={`option-card ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")} style={{ cursor: "pointer" }}>
          <div className="icon blue">M</div>
          <h3>Carga Manual</h3>
          <p>Ingresa materias una por una.</p>
        </div>
        <div className={`option-card ${mode === "excel" ? "active" : ""}`} onClick={() => setMode("excel")} style={{ cursor: "pointer" }}>
          <div className="icon green">X</div>
          <h3>Subir Excel</h3>
          <p>Genera preview, corrige filas y confirma.</p>
        </div>
      </div>

      {mode === "manual" && (
        <form onSubmit={submitManual} style={{ marginTop: 24, padding: 24, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
          <h3>Carga manual</h3>
          {rows.map((row, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.6fr 0.7fr 0.8fr auto", gap: 8, marginBottom: 8 }}>
              <select value={row.materiaId} onChange={(e) => updateRow(idx, "materiaId", e.target.value)}>
                <option value="">-- Materia --</option>
                {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.nombre} ({subject.codigo})</option>)}
              </select>
              <select value={row.estado} onChange={(e) => updateRow(idx, "estado", e.target.value)}>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
              </select>
              <input type="number" min={0} max={10} placeholder="Nota" value={row.nota} onChange={(e) => updateRow(idx, "nota", e.target.value)} />
              <select value={row.cuatrimestre} onChange={(e) => updateRow(idx, "cuatrimestre", Number(e.target.value))}>
                <option value={0}>Anual</option>
                <option value={1}>1C</option>
                <option value={2}>2C</option>
              </select>
              <input type="number" value={row.anioCursada} onChange={(e) => updateRow(idx, "anioCursada", Number(e.target.value))} />
              <button type="button" onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}>Quitar</button>
            </div>
          ))}
          <button type="button" onClick={() => setRows((prev) => [...prev, { materiaId: "", estado: "Aprobada", nota: "", cuatrimestre: 1, anioCursada: currentYear }])}>Agregar fila</button>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginLeft: 8 }}>Guardar</button>
        </form>
      )}

      {mode === "excel" && (
        <div style={{ marginTop: 24, padding: 24, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
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
          <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            {loading ? "Procesando..." : "Seleccionar archivo"}
          </button>
          <button type="button" className="btn-secondary" onClick={downloadTemplate} style={{ marginLeft: 8 }}>Descargar plantilla</button>

          {preview.length > 0 && (
            <div style={{ marginTop: 16, overflowX: "auto" }}>
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
                      <td style={{ color: row.errores.length ? "#c33" : "#15803d" }}>{row.errores.join("; ") || "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn-primary" onClick={confirmPreview} disabled={loading} style={{ marginTop: 12 }}>Confirmar importacion</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadSituation;
