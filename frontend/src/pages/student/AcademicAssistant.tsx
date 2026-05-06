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
  horasSemanalesEstimadas?: number;
  esOptativa?: boolean;
}

interface FinalPendiente {
  materia: { _id: string; nombre: string; codigo: string; creditos: number };
  fechaRegular: string;
  intentosPrevios?: number;
  venceRegularidad?: string;
}

interface Avance {
  totalMaterias: number;
  aprobadas: number;
  regularizadas: number;
  cursando: number;
  creditosAprobados: number;
  creditosMateriasAprobadas?: number;
  creditosActividades?: number;
  creditosNecesarios: number;
  creditosOptativasAprobados: number;
  materiasUnahurRequeridas: number;
  nivelInglesRequerido: string;
  materiasUnahurFaltantes: number;
  avancePorAnio: Record<string, { aprobadas: number; regulares: number; cursando: number; total?: number }>;
  porcentajeAvance: number;
}

interface PlanPeriodo {
  anio: number;
  cuatrimestre: number;
  horasUsadas: number;
  materias: Subject[];
}

interface RendimientoPlan {
  plan: string | null;
  anioInicio: number;
  materiasEsperadasAprobadas: number;
  materiasAprobadasEsperadas: number;
  diferencia: number;
  estado: "al-dia" | "leve-desvio" | "atrasado";
  porcentajeCumplimiento: number;
}

interface SavedPlan {
  _id: string;
  nombre: string;
  horasPorSemana: number;
  periodos: PlanPeriodo[];
}

const AcademicAssistant = () => {
  const [disponibles, setDisponibles] = useState<Subject[]>([]);
  const [finales, setFinales] = useState<FinalPendiente[]>([]);
  const [avance, setAvance] = useState<Avance | null>(null);
  const [rendimiento, setRendimiento] = useState<RendimientoPlan | null>(null);
  const [planificador, setPlanificador] = useState<PlanPeriodo[]>([]);
  const [planesGuardados, setPlanesGuardados] = useState<SavedPlan[]>([]);
  const [simulacion, setSimulacion] = useState<Subject[]>([]);
  const [materiasCursando, setMateriasCursando] = useState<Subject[]>([]);
  const [seleccionQuePasaSi, setSeleccionQuePasaSi] = useState<string[]>([]);
  const [horasPorSemana, setHorasPorSemana] = useState(12);
  const [nombrePlan, setNombrePlan] = useState("Plan tentativo");
  const [actividad, setActividad] = useState({ nombre: "", creditos: 1 });
  const [oferta, setOferta] = useState({
    anio: new Date().getFullYear(),
    cuatrimestre: new Date().getMonth() < 7 ? 1 : 2,
    soloOferta: false
  });
  const [filterAnio, setFilterAnio] = useState("todos");
  const [showOptativas, setShowOptativas] = useState<"todas" | "obligatorias" | "optativas">("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAll = useCallback(async () => {
    const params = oferta.soloOferta
      ? `?soloOferta=true&anio=${oferta.anio}&cuatrimestre=${oferta.cuatrimestre}`
      : "";
    const [d, f, a, i, p, r, saved] = await Promise.all([
      api.get(`/academico/disponibles${params}`),
      api.get("/finales/pendientes"),
      api.get("/academico/avance"),
      api.get("/academico/inscripciones-activas"),
      api.get(`/academico/planificador?horasPorSemana=${horasPorSemana}`),
      api.get("/academico/rendimiento-plan"),
      api.get("/academico/planes-guardados")
    ]);
    setDisponibles(d.data);
    setFinales(f.data);
    setAvance(a.data);
    setMateriasCursando(i.data.map((row: { materia: Subject }) => row.materia).filter(Boolean));
    setPlanificador(p.data.periodos || []);
    setRendimiento(r.data);
    setPlanesGuardados(saved.data);
    setLoading(false);
  }, [oferta, horasPorSemana]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAll().catch(() => {
        setError("No se pudieron cargar los datos del asistente");
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAll]);

  const inscribirseCursada = async (materiaId: string) => {
    setError("");
    setSuccess("");
    try {
      await api.post("/academico/inscripciones", {
        materiaId,
        cuatrimestre: oferta.cuatrimestre,
        anioCursada: oferta.anio
      });
      setSuccess("Inscripcion a cursada registrada");
      await fetchAll();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al inscribirse");
    }
  };

  const inscribirseFinal = async (materiaId: string) => {
    setError("");
    setSuccess("");
    try {
      await api.post("/finales", { materiaId, fecha: new Date().toISOString() });
      setSuccess("Inscripcion a final registrada");
      await fetchAll();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al inscribirse al final");
    }
  };

  const guardarActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/academico/actividades-creditos", actividad);
      setActividad({ nombre: "", creditos: 1 });
      setSuccess("Actividad con creditos registrada");
      await fetchAll();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al registrar actividad");
    }
  };

  const simular = async () => {
    const res = await api.post("/academico/que-pasa-si", { materias: seleccionQuePasaSi });
    setSimulacion(res.data.desbloqueadas || []);
  };

  const guardarPlanificador = async () => {
    setError("");
    setSuccess("");
    try {
      await api.post("/academico/planes-guardados", {
        nombre: nombrePlan,
        horasPorSemana,
        periodos: planificador
      });
      setSuccess("Planificacion guardada");
      await fetchAll();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al guardar la planificacion");
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
      <h1>Asistente Academico</h1>
      <p className="subtitle">Analisis actual, oferta, simulaciones y planificador.</p>

      {error && <div style={{ padding: 12, background: "#fee", color: "#c33", borderRadius: 8 }}>{error}</div>}
      {success && <div style={{ padding: 12, background: "#dfd", color: "#363", borderRadius: 8 }}>{success}</div>}
      {loading && <p>Cargando datos...</p>}

      {avance && (
        <div className="section" style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <h3>Tu avance</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div style={{ padding: 12, background: "#eff6ff", borderRadius: 8 }}>
              <strong>Avance general</strong>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{avance.porcentajeAvance}%</div>
              <small>{avance.aprobadas} de {avance.totalMaterias} materias</small>
            </div>
            <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 8 }}>
              <strong>Creditos</strong>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{avance.creditosAprobados}/{avance.creditosNecesarios}</div>
              <small>Materias: {avance.creditosMateriasAprobadas ?? avance.creditosAprobados} · Actividades: {avance.creditosActividades ?? 0}</small>
            </div>
            <div style={{ padding: 12, background: "#fef3c7", borderRadius: 8 }}>
              <strong>UNAHUR faltantes</strong>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{avance.materiasUnahurFaltantes}</div>
              <small>Ingles requerido: {avance.nivelInglesRequerido}</small>
            </div>
          </div>
        </div>
      )}

      {rendimiento && (
        <div className="section">
          <h3>Rendimiento vs plan</h3>
          <div className="projection">
            <strong>{rendimiento.plan || "Plan actual"}</strong>
            <p>
              Esperadas aprobadas: {rendimiento.materiasEsperadasAprobadas} · Aprobadas: {rendimiento.materiasAprobadasEsperadas}
            </p>
            <p>
              Cumplimiento: {rendimiento.porcentajeCumplimiento}% · Estado: {rendimiento.estado.replace("-", " ")}
            </p>
          </div>
        </div>
      )}

      {avance && Object.keys(avance.avancePorAnio).length > 0 && (
        <div className="section">
          <h3>Avance por anio</h3>
          {Object.entries(avance.avancePorAnio)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([anio, row]) => (
              <div key={anio} className="projection">
                <strong>Anio {anio}</strong>
                <p>Aprobadas: {row.aprobadas} · Regulares: {row.regulares} · Cursando: {row.cursando} · Total: {row.total ?? "-"}</p>
              </div>
            ))}
        </div>
      )}

      <div className="section">
        <h3>Materias disponibles</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
          <select value={filterAnio} onChange={(e) => setFilterAnio(e.target.value)}>
            <option value="todos">Todos los anios</option>
            {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y} anio</option>)}
          </select>
          <select value={showOptativas} onChange={(e) => setShowOptativas(e.target.value as "todas" | "obligatorias" | "optativas")}>
            <option value="todas">Todas</option>
            <option value="obligatorias">Obligatorias</option>
            <option value="optativas">Optativas</option>
          </select>
          <input type="number" value={oferta.anio} onChange={(e) => setOferta((s) => ({ ...s, anio: Number(e.target.value) }))} />
          <select value={oferta.cuatrimestre} onChange={(e) => setOferta((s) => ({ ...s, cuatrimestre: Number(e.target.value) }))}>
            <option value={1}>1C</option>
            <option value={2}>2C</option>
            <option value={0}>Anual</option>
          </select>
          <label><input type="checkbox" checked={oferta.soloOferta} onChange={(e) => setOferta((s) => ({ ...s, soloOferta: e.target.checked }))} /> Filtrar por oferta</label>
        </div>
        {filteredDisponibles.map((s) => (
          <div key={s._id} className="subject success">
            <div>
              <strong>{s.nombre}</strong>
              <p>{s.codigo} · {s.creditos} creditos</p>
            </div>
            <button onClick={() => inscribirseCursada(s._id)} className="btn-primary">Inscribirse</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Finales pendientes</h3>
        {finales.map((f) => (
          <div key={f.materia._id} className="final-card">
            <div>
              <strong>{f.materia.nombre}</strong>
              <p>Regularizada: {new Date(f.fechaRegular).toLocaleDateString()} · Intentos: {f.intentosPrevios ?? 0}</p>
              {f.venceRegularidad && <small>Vence: {new Date(f.venceRegularidad).toLocaleDateString()}</small>}
            </div>
            <button onClick={() => inscribirseFinal(f.materia._id)} className="btn-primary">Inscribirse</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Que pasa si regularizo...</h3>
        <div style={{ display: "grid", gap: 6 }}>
          {materiasCursando.map((materia) => (
            <label key={materia._id}>
              <input
                type="checkbox"
                checked={seleccionQuePasaSi.includes(materia._id)}
                onChange={() => setSeleccionQuePasaSi((prev) => prev.includes(materia._id) ? prev.filter((id) => id !== materia._id) : [...prev, materia._id])}
              />
              {materia.nombre}
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={simular} style={{ marginTop: 8 }}>Simular</button>
        {simulacion.length > 0 && (
          <ul>{simulacion.map((m) => <li key={m._id}>{m.nombre} ({m.codigo})</li>)}</ul>
        )}
      </div>

      <div className="section">
        <h3>Planificador por horas semanales</h3>
        <label>Horas por semana </label>
        <input type="number" min={1} value={horasPorSemana} onChange={(e) => setHorasPorSemana(Number(e.target.value))} />
        <input value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} placeholder="Nombre del plan" style={{ marginLeft: 8 }} />
        <button className="btn-primary" onClick={guardarPlanificador} style={{ marginLeft: 8 }} disabled={planificador.length === 0}>Guardar plan</button>
        {planificador.map((periodo) => (
          <div key={`${periodo.anio}-${periodo.cuatrimestre}`} className="projection">
            <h4>{periodo.anio} - {periodo.cuatrimestre === 0 ? "Anual" : `${periodo.cuatrimestre}C`} ({periodo.horasUsadas} h/sem)</h4>
            <ul>{periodo.materias.map((m) => <li key={m._id}>{m.nombre} ({m.creditos} cr., {m.horasSemanalesEstimadas ?? m.creditos} h/sem)</li>)}</ul>
          </div>
        ))}
        {planesGuardados.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>Planes guardados</strong>
            <ul>{planesGuardados.map((plan) => <li key={plan._id}>{plan.nombre} ({plan.horasPorSemana} h/sem, {plan.periodos.length} periodos)</li>)}</ul>
          </div>
        )}
      </div>

      <div className="section">
        <h3>Actividades con creditos</h3>
        <form onSubmit={guardarActividad} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Actividad" value={actividad.nombre} onChange={(e) => setActividad((s) => ({ ...s, nombre: e.target.value }))} required />
          <input type="number" min={1} value={actividad.creditos} onChange={(e) => setActividad((s) => ({ ...s, creditos: Number(e.target.value) }))} required />
          <button className="btn-primary" type="submit">Registrar</button>
        </form>
      </div>
    </div>
  );
};

export default AcademicAssistant;
