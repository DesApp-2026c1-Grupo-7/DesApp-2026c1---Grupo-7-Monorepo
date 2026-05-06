import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AcademicAssistant.css";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
  anio: number;
  cuatrimestre: number;
  creditos: number;
  esOptativa?: boolean;
  esUnahur?: boolean;
}

interface FinalPendiente {
  materia: { _id: string; nombre: string; codigo: string; creditos: number };
  cuatrimestre?: number;
  anioCursada?: number;
  fechaRegular: string;
}

interface Avance {
  totalMaterias: number;
  aprobadas: number;
  regularizadas: number;
  cursando: number;
  pendientes: number;
  creditosAprobados: number;
  creditosNecesarios: number;
  creditosOptativasAprobados: number;
  creditosOptativasNecesarios: number;
  nivelInglesRequerido: string;
  materiasUnahurFaltantes: number;
  avancePorAnio: Record<string, { aprobadas: number; regulares: number; cursando: number }>;
  porcentajeAvance: number;
}

const AcademicAssistant = () => {
  const [disponibles, setDisponibles] = useState<Subject[]>([]);
  const [finales, setFinales] = useState<FinalPendiente[]>([]);
  const [proyeccion, setProyeccion] = useState<Record<string, Subject[]>>({});
  const [avance, setAvance] = useState<Avance | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterAnio, setFilterAnio] = useState<string>("todos");
  const [showOptativas, setShowOptativas] = useState<"todas" | "obligatorias" | "optativas">("todas");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [d, f, p, a] = await Promise.all([
        api.get("/academico/disponibles"),
        api.get("/finales/pendientes"),
        api.get("/academico/proyeccion"),
        api.get("/academico/avance")
      ]);
      setDisponibles(d.data);
      setFinales(f.data);
      setProyeccion(p.data);
      setAvance(a.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAll]);

  const inscribirseCursada = async (materiaId: string) => {
    setError(""); setSuccess("");
    try {
      const now = new Date();
      const cuatri = now.getMonth() < 7 ? 1 : 2;
      await api.post("/academico/inscripciones", {
        materiaId,
        cuatrimestre: cuatri,
        anioCursada: now.getFullYear()
      });
      setSuccess("¡Inscripción a cursada registrada!");
      await fetchAll();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al inscribirse");
    }
  };

  const inscribirseFinal = async (materiaId: string) => {
    setError(""); setSuccess("");
    try {
      await api.post("/finales", { materiaId, fecha: new Date().toISOString() });
      setSuccess("¡Inscripción a final registrada!");
      await fetchAll();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al inscribirse al final");
    }
  };

  const filteredDisponibles = disponibles
    .filter((s) => filterAnio === "todos" || s.anio.toString() === filterAnio)
    .filter((s) => {
      if (showOptativas === "todas") return true;
      if (showOptativas === "optativas") return s.esOptativa;
      return !s.esOptativa;
    });

  return (
    <div className="assistant">
      <h1>Asistente Académico</h1>
      <p className="subtitle">Planifica tu cursada y optimiza tu avance</p>

      {error && <div style={{ padding: '12px 16px', background: '#fee', color: '#c33', borderRadius: 8, margin: '16px 0' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#dfd', color: '#363', borderRadius: 8, margin: '16px 0' }}>{success}</div>}

      {loading && <p>Cargando datos...</p>}

      {/* AVANCE */}
      {avance && (
        <div className="section" style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h3>📊 Tu Avance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
            <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8 }}>
              <strong>Avance general</strong>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{avance.porcentajeAvance}%</div>
              <small>{avance.aprobadas} de {avance.totalMaterias} materias</small>
            </div>
            <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
              <strong>Créditos</strong>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>
                {avance.creditosAprobados}/{avance.creditosNecesarios}
              </div>
              <small>Optativos: {avance.creditosOptativasAprobados}/{avance.creditosOptativasNecesarios}</small>
            </div>
            <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8 }}>
              <strong>Materias UNAHUR faltantes</strong>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>{avance.materiasUnahurFaltantes}</div>
              <small>Inglés requerido: {avance.nivelInglesRequerido}</small>
            </div>
            <div style={{ padding: 12, background: '#fce7f3', borderRadius: 8 }}>
              <strong>Cursando ahora</strong>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#be185d' }}>{avance.cursando}</div>
              <small>Regulares: {avance.regularizadas}</small>
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Análisis por año de cursada</summary>
            <div style={{ marginTop: 8 }}>
              {Object.keys(avance.avancePorAnio).sort().map((y) => {
                const d = avance.avancePorAnio[y];
                return (
                  <div key={y} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    <strong>Año {y}:</strong>{" "}
                    {d.aprobadas} aprobadas, {d.regulares} regulares, {d.cursando} cursando
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}

      {/* DISPONIBLES */}
      <div className="section">
        <h3>📘 Materias Disponibles para Cursar</h3>
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <select value={filterAnio} onChange={(e) => setFilterAnio(e.target.value)}>
            <option value="todos">Todos los años</option>
            {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}° año</option>)}
          </select>
          <select value={showOptativas} onChange={(e) => setShowOptativas(e.target.value as "todas" | "obligatorias" | "optativas")}>
            <option value="todas">Todas</option>
            <option value="obligatorias">Obligatorias</option>
            <option value="optativas">Optativas</option>
          </select>
        </div>
        {filteredDisponibles.length === 0 ? (
          <p style={{ padding: 12, color: '#666' }}>No hay materias disponibles para cursar (verifica tu situación académica).</p>
        ) : (
          filteredDisponibles.map((s) => (
            <div key={s._id} className="subject success">
              <div>
                <strong>{s.nombre}</strong>
                <p>Año {s.anio} · {s.cuatrimestre === 0 ? 'Anual' : `${s.cuatrimestre}°C`} · {s.creditos} créditos</p>
                {s.esOptativa && <small style={{ color: '#92400e' }}>⭐ Optativa</small>}
              </div>
              <button onClick={() => inscribirseCursada(s._id)} className="btn-primary" style={{ padding: '6px 12px' }}>
                Inscribirse
              </button>
            </div>
          ))
        )}
      </div>

      {/* FINALES */}
      <div className="section">
        <h3>📅 Finales Pendientes</h3>
        {finales.length === 0 ? (
          <p style={{ padding: 12, color: '#666' }}>No tienes finales pendientes.</p>
        ) : (
          finales.map((f) => (
            <div key={f.materia._id} className="final-card">
              <div>
                <strong>{f.materia.nombre}</strong>
                <p>Regularizada: {new Date(f.fechaRegular).toLocaleDateString()}</p>
                <small>{f.materia.creditos} créditos</small>
              </div>
              <button onClick={() => inscribirseFinal(f.materia._id)} className="btn-primary">
                Inscribirse
              </button>
            </div>
          ))
        )}
      </div>

      {/* PROYECCION */}
      <div className="section">
        <h3>📈 Proyección de Cursada Sugerida</h3>
        <p className="small">Basado en las materias del plan que aún no aprobaste</p>
        {Object.keys(proyeccion).length === 0 ? (
          <p style={{ padding: 12, color: '#666' }}>¡Felicitaciones! No hay materias pendientes en tu proyección.</p>
        ) : (
          Object.keys(proyeccion).sort().map((key) => (
            <div key={key} className="projection">
              <h4>{key}</h4>
              <ul>
                {proyeccion[key].map((m) => (
                  <li key={m._id}>{m.nombre} <small>({m.codigo}, {m.creditos} cr.)</small></li>
                ))}
              </ul>
            </div>
          ))
        )}
        <div className="note">
          Esta es una proyección basada en tu plan de estudio. El planificador detallado considera correlatividades.
        </div>
      </div>
    </div>
  );
};

export default AcademicAssistant;
