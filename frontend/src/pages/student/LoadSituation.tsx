import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/LoadSituation.css";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
  anio: number;
  cuatrimestre: number;
}

interface ManualRow {
  materiaId: string;
  estado: string;
  nota: string;
  cuatrimestre: number;
  anioCursada: number;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importResult, setImportResult] = useState<{
    procesados: { codigo: string; estado: string }[];
    errores: { fila: number; motivo: string }[];
  } | null>(null);

  useEffect(() => {
    api.get("/materias").then((r) => setSubjects(r.data)).catch(() => {});
  }, []);

  const updateRow = (idx: number, k: keyof ManualRow, v: string | number) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [k]: v } : r));
  };
  const addRow = () => setRows((prev) => [...prev, {
    materiaId: "", estado: "Aprobada", nota: "", cuatrimestre: 1, anioCursada: currentYear
  }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const records = rows
        .filter((r) => r.materiaId)
        .map((r) => ({
          materiaId: r.materiaId,
          estado: r.estado,
          nota: r.nota ? Number(r.nota) : undefined,
          cuatrimestre: Number(r.cuatrimestre),
          anioCursada: Number(r.anioCursada)
        }));
      if (records.length === 0) {
        setError("Agrega al menos una materia.");
        setLoading(false); return;
      }
      const r = await api.post("/academico/situacion/bulk", { records });
      setSuccess(r.data.mensaje);
      setTimeout(() => navigate("/student/situation"), 1500);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al cargar la situación");
    } finally {
      setLoading(false);
    }
  };

  const submitExcel = async (file: File) => {
    setError(""); setSuccess(""); setImportResult(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/academico/situacion/import-excel", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess(r.data.mensaje);
      setImportResult({ procesados: r.data.procesados, errores: r.data.errores });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al importar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      "codigo,estado,nota,cuatrimestre,anio",
      "AED,Aprobada,9,1,2024",
      "AM1,Aprobada,8,1,2024",
      "AM2,Regular,,2,2024"
    ].join("\n");
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
      <span className="back" onClick={() => navigate("/student/situation")}>← Volver al historial</span>

      <h1>Cargar Situación Académica</h1>
      <p className="subtitle">Elige cómo deseas cargar tu historial académico</p>

      {error && <div style={{ padding: '12px 16px', background: '#fee', color: '#c33', borderRadius: 8, margin: '16px 0' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#dfd', color: '#363', borderRadius: 8, margin: '16px 0' }}>{success}</div>}

      <div className="options">
        <div className={`option-card ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")} style={{ cursor: 'pointer' }}>
          <div className="icon blue">✏️</div>
          <h3>Carga Manual</h3>
          <p>Ingresa tus materias una por una mediante un formulario</p>
          <ul>
            <li>✔ Control total de los datos</li>
            <li>✔ Ideal para pocas materias</li>
            <li>✔ Validación en tiempo real</li>
          </ul>
        </div>

        <div className={`option-card ${mode === "excel" ? "active" : ""}`} onClick={() => setMode("excel")} style={{ cursor: 'pointer' }}>
          <div className="icon green">⬆️</div>
          <h3>Subir Excel</h3>
          <p>Importa tu historial desde un archivo Excel o CSV</p>
          <ul>
            <li>✔ Carga masiva de datos</li>
            <li>✔ Rápido y eficiente</li>
            <li>✔ Detección de errores</li>
          </ul>
        </div>
      </div>

      {mode === "manual" && (
        <form onSubmit={submitManual} style={{ marginTop: 24, padding: 24, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
          <h3>Carga manual de materias</h3>
          {rows.map((row, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.6fr 0.7fr 0.8fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select value={row.materiaId} onChange={(e) => updateRow(idx, 'materiaId', e.target.value)} required>
                <option value="">-- Materia --</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.nombre} ({s.codigo})</option>)}
              </select>
              <select value={row.estado} onChange={(e) => updateRow(idx, 'estado', e.target.value)}>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <input type="number" min={0} max={10} step={0.1} placeholder="Nota" value={row.nota} onChange={(e) => updateRow(idx, 'nota', e.target.value)} />
              <select value={row.cuatrimestre} onChange={(e) => updateRow(idx, 'cuatrimestre', Number(e.target.value))}>
                <option value={0}>Anual</option>
                <option value={1}>1°C</option>
                <option value={2}>2°C</option>
              </select>
              <input type="number" placeholder="Año" value={row.anioCursada} onChange={(e) => updateRow(idx, 'anioCursada', Number(e.target.value))} />
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(idx)} style={{ padding: '6px 10px', background: '#fee', color: '#c33', border: 'none', borderRadius: 6, cursor: 'pointer' }}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRow} style={{ marginTop: 8, padding: '8px 12px', background: '#eef', border: '1px dashed #99c', borderRadius: 6, cursor: 'pointer' }}>+ Agregar fila</button>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
            <button type="button" className="btn-secondary" onClick={() => setMode("none")}>Cancelar</button>
          </div>
        </form>
      )}

      {mode === "excel" && (
        <div style={{ marginTop: 24, padding: 24, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
          <h3>Importar desde Excel/CSV</h3>
          <p style={{ fontSize: 14, color: '#666' }}>
            El archivo debe tener columnas: <code>codigo, estado, nota, cuatrimestre, anio</code>
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) submitExcel(f);
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              {loading ? "Procesando..." : "Seleccionar archivo"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode("none")}>Cancelar</button>
          </div>

          {importResult && (
            <div style={{ marginTop: 16 }}>
              <h4>Resultados de la importación</h4>
              <p>✅ Procesados: {importResult.procesados.length}</p>
              {importResult.errores.length > 0 && (
                <details>
                  <summary>⚠️ {importResult.errores.length} errores</summary>
                  <ul>{importResult.errores.map((e, i) => <li key={i}>Fila {e.fila}: {e.motivo}</li>)}</ul>
                </details>
              )}
              <button onClick={() => navigate("/student/situation")} className="btn-primary" style={{ marginTop: 12 }}>
                Ver mi situación académica
              </button>
            </div>
          )}
        </div>
      )}

      <div className="template-box">
        <h4>Plantilla de Excel</h4>
        <p>Para facilitar la carga, descarga nuestra plantilla con el formato correcto.</p>
        <button className="btn-primary" onClick={downloadTemplate}>Descargar Plantilla</button>
      </div>
    </div>
  );
};

export default LoadSituation;
