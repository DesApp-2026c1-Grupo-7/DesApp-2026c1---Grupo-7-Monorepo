import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import api from "../../services/api";
import { moverMateriaConCascada } from "../../utils/planificadorCascada";
import "../../styles/AcademicAssistant.css";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
  anio: number;
  cuatrimestre: number;
  creditos: number;
  horasSemanalesEstimadas?: number;
  correlativas?: string[];
  correlativasEnCurso?: string[];
  esOptativa?: boolean;
  esUnahur?: boolean;
}

interface Periodo {
  anio: number;
  cuatrimestre: number;
}

interface FinalPendiente {
  materia: { _id: string; nombre: string; codigo: string; creditos: number };
  fechaRegular: string;
  intentosPrevios?: number;
  venceRegularidad?: string;
  yaInscripto: boolean;
  finalId: string | null;
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
  avancePorAnio: Record<string, { aprobadas: number; regulares: number; cursando: number; total?: number; materiasFaltantes?: string[] }>;
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
  materiasAprobadasReales: number;
  diferencia: number;
  estado: "al-dia" | "leve-desvio" | "atrasado";
  porcentajeCumplimiento: number;
}

interface SavedPlan {
  _id: string;
  nombre: string;
  horasPorSemana: number;
  periodos: PlanPeriodo[];
  ultimoRecalculo?: {
    fecha: string;
    materiasRetrasadas: {
      materia: string;
      nombre: string;
      codigo: string;
      periodoOrigen: string;
      periodoNuevo: string;
    }[];
  };
}

interface ComparacionPlan {
  plan: string;
  materiasEsperadas: number;
  materiasCumplidas: number;
  materiasCumplidasTotal: number;
  totalPlan?: number;
  diferencia: number;
  estado: "al-dia" | "leve-desvio" | "atrasado";
  porcentajeCumplimiento: number;
  periodos?: {
    anio: number;
    cuatrimestre: number;
    transcurrido: boolean;
    totalMaterias: number;
    cumplidas: number;
    materiasCumplidas: { nombre: string; codigo: string }[];
    materiasAtrasadas: { nombre: string; codigo: string; estado: string }[];
  }[];
}

function MateriaArrastrable({ id, nombre, children }: { id: string; nombre: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `materia-${id}` });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="materia-drag-handle"
      style={{ cursor: isDragging ? "grabbing" : "grab", opacity: isDragging ? 0.4 : 1, touchAction: "none" }}
      aria-label={`Arrastrar ${nombre} a otro cuatrimestre`}
    >
      ⠿ {children}
    </span>
  );
}

function PeriodoSoltable({ idx, children }: { idx: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `periodo-${idx}` });
  return (
    <div ref={setNodeRef} className={isOver ? "periodo-drop-activo" : undefined}>
      {children}
    </div>
  );
}

const AcademicAssistant = () => {
  const [disponibles, setDisponibles] = useState<Subject[]>([]);
  const [finales, setFinales] = useState<FinalPendiente[]>([]);
  const [avance, setAvance] = useState<Avance | null>(null);
  const [rendimiento, setRendimiento] = useState<RendimientoPlan | null>(null);
  const [planificador, setPlanificador] = useState<PlanPeriodo[]>([]);
  const [primerPeriodo, setPrimerPeriodo] = useState<Periodo | null>(null);
  const [pendientesPlan, setPendientesPlan] = useState<Subject[]>([]);
  const [planesGuardados, setPlanesGuardados] = useState<SavedPlan[]>([]);
  const [comparaciones, setComparaciones] = useState<Record<string, ComparacionPlan>>({});
  const [simulacion, setSimulacion] = useState<{
    _id: string;
    nombre: string;
    codigo: string;
    correlativasSimuladas: { _id: string; nombre: string }[];
  }[]>([]);
  const [materiasCursando, setMateriasCursando] = useState<Subject[]>([]);
  const [seleccionQuePasaSi, setSeleccionQuePasaSi] = useState<Record<string, string>>({});
  const [horasPorSemana, setHorasPorSemana] = useState(12);
  const [nombrePlan, setNombrePlan] = useState("Plan tentativo");
  const [oferta, setOferta] = useState({
    anio: new Date().getFullYear(),
    cuatrimestre: new Date().getMonth() < 7 ? 1 : 2,
    soloOferta: true
  });
  const [filterAnio, setFilterAnio] = useState("todos");
  const [showOptativas, setShowOptativas] = useState<"todas" | "obligatorias" | "optativas">("todas");
  // Año cuyo tooltip de materias faltantes está abierto (hover/foco). Se renderiza
  // de forma condicional para no dejar los nombres en el DOM cuando está cerrado.
  const [faltantesAbierto, setFaltantesAbierto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resaltadas, setResaltadas] = useState<string[]>([]);
  const resaltadoTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(resaltadoTimer.current), []);

  // Estado para el modal de resultados de finales
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [finalToGrade, setFinalToGrade] = useState<{ id: string, nombre: string, subjectId: string } | null>(null);
  const [gradeResult, setGradeResult] = useState({ nota: 7, ausente: false });

  // Estado para el modal de baja de finales
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [finalToDelete, setFinalToDelete] = useState<{ id: string, nombre: string } | null>(null);
  const [planExpandido, setPlanExpandido] = useState<string | null>(null);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

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
    setPrimerPeriodo(p.data.primerPeriodo || null);
    setPendientesPlan(p.data.pendientesNoPlanificadas || []);
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

  const openFinalModal = (id: string, nombre: string) => {
    setFinalToDelete({ id, nombre });
    setShowFinalModal(true);
  };

  const closeFinalModal = () => {
    setShowFinalModal(false);
    setFinalToDelete(null);
  };

  const confirmDarseDeBajaFinal = async () => {
    if (!finalToDelete) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/finales/${finalToDelete.id}`);
      setSuccess("Inscripcion a final eliminada");
      await fetchAll();
      closeFinalModal();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al eliminar inscripción");
    }
  };

  const openGradeModal = (id: string, nombre: string, subjectId: string) => {
    setFinalToGrade({ id, nombre, subjectId });
    setShowGradeModal(true);
  };

  const closeGradeModal = () => {
    setShowGradeModal(false);
    setFinalToGrade(null);
  };

  const previewEstadoFinal = (nota: number): string => {
    if (nota >= 1 && nota <= 3) return "Desaprobado";
    if (nota > 3 && nota <= 10) return "Aprobado";
    return "";
  };

  const registrarNotaFinal = async () => {
    if (!finalToGrade) return;
    setError("");
    setSuccess("");
    try {
      const payload = gradeResult.ausente
        ? { ausente: true, nota: undefined }
        : { nota: gradeResult.nota };
      await api.put(`/finales/${finalToGrade.id}/resultado`, payload);
      setSuccess("Resultado de final registrado");
      await fetchAll();
      closeGradeModal();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al registrar nota");
    }
  };

  const simular = async () => {
    const hipotesis = Object.entries(seleccionQuePasaSi).map(([materiaId, estadoHipotetico]) => ({
      materiaId,
      estadoHipotetico
    }));

    if (hipotesis.length === 0) return;

    try {
      const res = await api.post("/academico/que-pasa-si", { materias: hipotesis });
      setSimulacion(res.data.desbloqueadas || []);
    } catch {
      setError("Error al simular el escenario");
    }
  };

  const toggleHipotesis = (id: string, estado: string) => {
    setSeleccionQuePasaSi(prev => {
      const current = prev[id];
      const next = {...prev};
      if (current === estado) {
        delete next[id];
      } else {
        next[id] = estado;
      }
      return next;
    });
  };

  const resaltarMovidas = (ids: string[]) => {
    window.clearTimeout(resaltadoTimer.current);
    setResaltadas(ids);
    resaltadoTimer.current = window.setTimeout(() => setResaltadas([]), 1200);
  };

  const aplicarMovimiento = (materiaId: string, destinoIdx: number) => {
    setError("");
    setSuccess("");
    const primerPeriodoIdx = primerPeriodo
      ? planificador.findIndex(
          (p) => p.anio === primerPeriodo.anio && p.cuatrimestre === primerPeriodo.cuatrimestre
        )
      : 0;
    const { periodos, movidas } = moverMateriaConCascada(planificador, materiaId, destinoIdx, {
      primerPeriodoIdx: primerPeriodoIdx < 0 ? 0 : primerPeriodoIdx,
    });
    if (movidas.length === 0) {
      setSuccess("Sin cambios en el plan");
      return;
    }
    setPlanificador(periodos);
    resaltarMovidas(movidas);
    setSuccess(
      movidas.length > 1
        ? `Se reacomodaron ${movidas.length} materias para mantener las correlatividades`
        : "Materia movida"
    );
  };

  const moverMateria = (periodoIdx: number, materiaId: string, dir: -1 | 1) => {
    const destino = periodoIdx + dir;
    if (destino < 0) return;
    aplicarMovimiento(materiaId, destino);
  };

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const destino = Number(String(over.id).replace("periodo-", ""));
    const materiaId = String(active.id).replace("materia-", "");
    if (Number.isNaN(destino)) return;
    aplicarMovimiento(materiaId, destino);
  };

  const compararConPlan = async (planId: string) => {
    setError("");
    if (comparaciones[planId]) {
      setComparaciones((prev) => {
        const next = { ...prev };
        delete next[planId];
        return next;
      });
      return;
    }
    try {
      const res = await api.get(`/academico/planes-guardados/${planId}/comparacion`);
      setComparaciones((prev) => ({ ...prev, [planId]: res.data }));
    } catch {
      setError("No se pudo comparar el rendimiento con el plan guardado");
    }
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
      setSuccess("Planificación guardada");
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

      {error && (
        <div className="assistant-alert error" role="alert">
          <span className="assistant-alert__icon" aria-hidden="true">!</span>
          <span className="assistant-alert__message">{error}</span>
          <button className="assistant-alert__close" onClick={() => setError("")} aria-label="Cerrar">×</button>
        </div>
      )}
      {success && (
        <div className="assistant-alert success" role="status">
          <span className="assistant-alert__icon" aria-hidden="true">✓</span>
          <span className="assistant-alert__message">{success}</span>
          <button className="assistant-alert__close" onClick={() => setSuccess("")} aria-label="Cerrar">×</button>
        </div>
      )}
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
              Esperadas aprobadas: {rendimiento.materiasEsperadasAprobadas} · Aprobadas: {rendimiento.materiasAprobadasReales}
            </p>
            <p>
              Cumplimiento: {rendimiento.porcentajeCumplimiento}% · Estado: {rendimiento.estado.replace("-", " ")}
            </p>
          </div>
        </div>
      )}

      {avance && Object.keys(avance.avancePorAnio).length > 0 && (
        <div className="section">
          <h3>Avance por año</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {Object.entries(avance.avancePorAnio)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([anio, row]) => {
                const total = row.total ?? 0;
                const faltantes = Math.max(0, total - row.aprobadas - row.regulares - row.cursando);
                const completo = total > 0 && row.aprobadas === total;
                const porcentaje = total > 0 ? Math.round((row.aprobadas / total) * 100) : 0;
                return (
                  <div
                    key={anio}
                    style={{
                      padding: 14, borderRadius: 10, border: "1px solid #e5e7eb",
                      background: completo ? "#f0fdf4" : "#fff"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong>Año {anio}</strong>
                      {completo
                        ? <span className="badge" style={{ background: "#16a34a", color: "#fff" }}>✓ Completo</span>
                        : <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{porcentaje}%</span>}
                    </div>
                    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ width: `${porcentaje}%`, height: "100%", background: completo ? "#16a34a" : "#3b82f6" }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: "0.85rem" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: "#dcfce7", color: "#166534" }}>Aprobadas: {row.aprobadas}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: "#dbeafe", color: "#1e40af" }}>Regulares: {row.regulares}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: "#fef9c3", color: "#854d0e" }}>Cursando: {row.cursando}</span>
                      <span
                        className="faltantes-chip"
                        style={{ padding: "2px 8px", borderRadius: 6, background: "#fee2e2", color: "#991b1b", cursor: faltantes > 0 ? "help" : "default", position: "relative" }}
                        tabIndex={faltantes > 0 ? 0 : undefined}
                        onMouseEnter={() => faltantes > 0 && setFaltantesAbierto(anio)}
                        onMouseLeave={() => setFaltantesAbierto((prev) => (prev === anio ? null : prev))}
                        onFocus={() => faltantes > 0 && setFaltantesAbierto(anio)}
                        onBlur={() => setFaltantesAbierto((prev) => (prev === anio ? null : prev))}
                      >
                        Faltantes: {faltantes}
                        {faltantesAbierto === anio && row.materiasFaltantes && row.materiasFaltantes.length > 0 && (
                          <span className="faltantes-tooltip" role="tooltip">
                            <strong className="faltantes-tooltip-title">Materias faltantes de Año {anio}</strong>
                            <ul className="faltantes-tooltip-list">
                              {row.materiasFaltantes.map((nombre) => (
                                <li key={nombre}>{nombre}</li>
                              ))}
                            </ul>
                          </span>
                        )}
                      </span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: "#f3f4f6", color: "#374151" }}>Total: {total}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="section">
        <h3>Materias disponibles</h3>
        <p className="subtitle">Materias en las que podés inscribirte según tus correlativas y la oferta académica del período.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", margin: "12px 0" }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#6b7280", gap: 2 }}>
            Año
            <select value={filterAnio} onChange={(e) => setFilterAnio(e.target.value)}>
              <option value="todos">Todos los años</option>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y} año</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#6b7280", gap: 2 }}>
            Tipo
            <select value={showOptativas} onChange={(e) => setShowOptativas(e.target.value as "todas" | "obligatorias" | "optativas")}>
              <option value="todas">Todas</option>
              <option value="obligatorias">Obligatorias</option>
              <option value="optativas">Optativas</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#6b7280", gap: 2 }}>
            Oferta - Año
            <input type="number" value={oferta.anio} onChange={(e) => setOferta((s) => ({ ...s, anio: Number(e.target.value) }))} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#6b7280", gap: 2 }}>
            Oferta - Período
            <select value={oferta.cuatrimestre} onChange={(e) => setOferta((s) => ({ ...s, cuatrimestre: Number(e.target.value) }))}>
              <option value={1}>1C</option>
              <option value={2}>2C</option>
              <option value={0}>Anual</option>
            </select>
          </label>
        </div>
        {filteredDisponibles.length === 0 && !loading && (
          <p style={{ color: "#666", fontStyle: "italic" }}>No hay materias disponibles para inscribirte con este filtro.</p>
        )}
        {filteredDisponibles.map((s) => (
          <div key={s._id} className={`subject ${s.esUnahur ? 'warning' : 'success'}`} style={s.esUnahur ? { background: '#fef3c7', borderColor: '#fcd34d' } : {}}>
            <div>
              <strong>{s.nombre} {s.esUnahur && <span className="badge yellow" style={{ marginLeft: 8 }}>UNAHUR</span>}</strong>
              <p>{s.codigo} · {s.creditos} creditos</p>
            </div>
            <button onClick={() => inscribirseCursada(s._id)} className="btn-primary">Inscribirse</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Finales pendientes</h3>
        {finales.length === 0 && !loading && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No hay finales pendientes.</p>
        )}
        {finales.map((f) => (
          <div key={f.materia._id} className="final-card">
            <div>
              <strong>{f.materia.nombre}</strong>
              <p>Regularizada: {new Date(f.fechaRegular).toLocaleDateString()} · Intentos: {f.intentosPrevios ?? 0}</p>
              {f.venceRegularidad && <small>Vence: {new Date(f.venceRegularidad).toLocaleDateString()}</small>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {f.yaInscripto ? (
                <>
                  <button 
                    className="btn-primary" 
                    onClick={() => openGradeModal(f.finalId!, f.materia.nombre, f.materia._id)}
                  >
                    Registrar Nota
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => openFinalModal(f.materia._id, f.materia.nombre)}
                  >
                    Darse de baja
                  </button>
                </>
              ) : (
                <button onClick={() => inscribirseFinal(f.materia._id)} className="btn-primary">Inscribirse</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Que pasa si...</h3>
        <p className="subtitle">Simula pasar tus materias actuales para ver que se desbloquearia el proximo cuatri.</p>
        
        <div style={{ display: "grid", gap: 10, margin: '15px 0' }}>
          {materiasCursando.length > 0 ? (
            materiasCursando.map((m) => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.nombre}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    onClick={() => toggleHipotesis(m._id, 'Regular')}
                    style={{ 
                      padding: '6px 14px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid',
                      cursor: 'pointer', transition: 'all 0.2s',
                      backgroundColor: seleccionQuePasaSi[m._id] ? '#10b981' : '#fff',
                      color: seleccionQuePasaSi[m._id] ? '#fff' : '#4b5563',
                      borderColor: seleccionQuePasaSi[m._id] ? '#059669' : '#d1d5db',
                      fontWeight: 600,
                      boxShadow: seleccionQuePasaSi[m._id] ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none'
                    }}
                  >
                    {seleccionQuePasaSi[m._id] ? '✓ Seleccionada' : 'Aprobar/Regularizar'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No tienes materias en curso para simular.</p>
          )}
        </div>

        <button 
          className="btn-primary" 
          onClick={simular} 
          disabled={Object.keys(seleccionQuePasaSi).length === 0}
        >
          Ejecutar Simulacion
        </button>

        {simulacion.length > 0 ? (
          <div style={{ marginTop: 20, padding: 15, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>Nuevas materias desbloqueadas:</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {simulacion.map((m) => (
                <div key={m._id} style={{ padding: '8px 12px', background: '#fff', borderRadius: '6px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{m.nombre} ({m.codigo})</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                    Se desbloquea por: {m.correlativasSimuladas.map(c => c.nombre).join(', ') || 'Plan de estudios'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : Object.keys(seleccionQuePasaSi).length > 0 && (
          <p style={{ marginTop: 15, color: '#666', fontSize: '0.9rem' }}>
            Esta combinacion aun no habilita nuevas materias. Quizas falten mas correlativas.
          </p>
        )}
      </div>

      <div className="section" data-testid="planificador">
        <h3>Planificador de cursada</h3>
        <p className="subtitle">
          El sistema arma un plan hasta recibirte respetando correlatividades. Las materias que ya
          aprobaste o estás cursando no se planifican. Podés mover materias entre cuatrimestres y la
          carga horaria se recalcula sola.
        </p>
        <div className="planificador-controls">
          <label>Horas por semana
            <input
              type="number"
              min={1}
              value={horasPorSemana}
              aria-label="Horas por semana"
              onChange={(e) => setHorasPorSemana(Number(e.target.value))}
            />
          </label>
          <label>Nombre del plan
            <input value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} placeholder="Mi plan de cursada" />
          </label>
          <button className="btn-primary" onClick={guardarPlanificador} disabled={planificador.length === 0}>
            Guardar plan
          </button>
          <button className="btn-secondary" onClick={() => { fetchAll().then(() => setSuccess("Plan regenerado")).catch(() => setError("No se pudo regenerar el plan")); }}>
            Regenerar plan automático
          </button>
        </div>

        {planificador.length === 0 && !loading && (
          <p className="vacio-mensaje">
            No hay materias pendientes para planificar. ¡Vas al día!
          </p>
        )}

        <DndContext sensors={sensores} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          {planificador.map((periodo, idx) => {
            const excedido = periodo.horasUsadas > horasPorSemana;
            return (
              <PeriodoSoltable key={`${periodo.anio}-${periodo.cuatrimestre}-${idx}`} idx={idx}>
                <div className="periodo-card" data-testid="periodo">
                  <div className="periodo-card-header">
                    <h4>
                      {periodo.anio} - {periodo.cuatrimestre === 0 ? "Anual" : `${periodo.cuatrimestre}C`}
                    </h4>
                    <span className={`horas-badge ${excedido ? 'excedido' : ''}`}>
                      {periodo.horasUsadas} / {horasPorSemana} h/sem{excedido && " ⚠"}
                    </span>
                  </div>
                  <div className="periodo-materias">
                    {periodo.materias.map((m) => (
                      <div
                        key={m._id}
                        data-testid="periodo-materia"
                        className={`periodo-materia-item ${resaltadas.includes(m._id) ? 'materia-resaltada' : ''}`}
                      >
                        <div className="materia-info">
                          <MateriaArrastrable id={m._id} nombre={m.nombre}>{m.nombre}</MateriaArrastrable>
                          <span className="materia-meta">{m.creditos} cr. · {m.horasSemanalesEstimadas ?? m.creditos} h/sem</span>
                        </div>
                        <div className="materia-acciones">
                          <button
                            aria-label={`Mover ${m.nombre} a un cuatrimestre anterior`}
                            disabled={idx === 0}
                            onClick={() => moverMateria(idx, m._id, -1)}
                          >
                            ◀
                          </button>
                          <button
                            aria-label={`Mover ${m.nombre} a un cuatrimestre posterior`}
                            onClick={() => moverMateria(idx, m._id, 1)}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PeriodoSoltable>
            );
          })}
        </DndContext>

        {pendientesPlan.length > 0 && (
          <div className="pendientes-box" data-testid="pendientes-plan">
            <strong>No se pudieron ubicar ({pendientesPlan.length})</strong>
            <p>
              Requieren más horas semanales que el límite indicado o dependen de materias que tampoco entran.
              Subí las horas por semana para incluirlas.
            </p>
            <ul>{pendientesPlan.map((m) => <li key={m._id}>{m.nombre} ({m.horasSemanalesEstimadas} h/sem)</li>)}</ul>
          </div>
        )}

        {planesGuardados.length > 0 && (
          <div style={{ marginTop: 16 }} data-testid="planes-guardados">
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontWeight: 600, color: "#374151" }}>Planes guardados</h4>
            <p className="subtitle" style={{ marginBottom: 12, fontSize: "0.9rem" }}>
              Compará tu avance real contra el plan que te habías planteado.
            </p>
            {planesGuardados.map((plan) => {
              const comp = comparaciones[plan._id];
              const expandido = planExpandido === plan._id;
              const retrasadas = plan.ultimoRecalculo?.materiasRetrasadas || [];
              const retrasadasIds = new Set(retrasadas.map((r) => r.materia));
              return (
                <div key={plan._id} className="plan-guardado-card" data-testid="plan-guardado">
                  <div
                    className="plan-guardado-header"
                    onClick={() => setPlanExpandido(expandido ? null : plan._id)}
                  >
                    <span className="plan-nombre">
                      <span className="arrow">{expandido ? "\u25BC" : "\u25B6"}</span>
                      {plan.nombre}
                      <span className="plan-meta">({plan.horasPorSemana} h/sem · {plan.periodos.length} períodos)</span>
                    </span>
                    <div className="plan-acciones" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-secondary" onClick={() => compararConPlan(plan._id)}>
                        {comp ? "Ocultar comparación" : "Comparar rendimiento"}
                      </button>
                    </div>
                  </div>
                  {retrasadas.length > 0 && (
                    <div className="pendientes-box" style={{ marginTop: 8, background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" }} data-testid="recalculo-info">
                      <strong style={{ color: "#92400e" }}>Plan recalculado automáticamente</strong>
                      <p style={{ margin: "4px 0 0", color: "#78350f" }}>
                        {retrasadas.length === 1
                          ? `1 materia reubicada: ${retrasadas[0].nombre}`
                          : `${retrasadas.length} materias reubicadas: ${retrasadas.map((m) => m.codigo).join(", ")}`}
                      </p>
                    </div>
                  )}

                  {expandido && (
                    <div className="plan-guardado-detalle" data-testid="plan-detalle">
                      <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 600, color: "#475569" }}>Tu planificación actual:</h4>
                      {plan.periodos.length === 0 && (
                        <p className="vacio-mensaje" style={{ margin: 0 }}>Sin materias (plan vacío tras recálculo).</p>
                      )}
                      {plan.periodos.map((p, idx) => (
                        <div
                          key={idx}
                          className="plan-guardado-periodo transcurrido"
                        >
                          <div className="plan-guardado-periodo-header">
                            {p.anio} - {p.cuatrimestre === 0 ? "Anual" : `${p.cuatrimestre}C`}
                            <span className="periodo-meta">
                              {p.horasUsadas} h/sem · {p.materias.length} {p.materias.length === 1 ? "materia" : "materias"}
                            </span>
                          </div>
                          <div className="plan-guardado-materias">
                            {p.materias.map((m) => {
                              const fueRetrasada = retrasadasIds.has(m._id);
                              return (
                                <span
                                  key={m._id}
                                  title={fueRetrasada ? "Reubicada por recálculo automático" : undefined}
                                  className={`materia-chip ${fueRetrasada ? 'retrasada' : 'normal'}`}
                                >
                                  {m.codigo || m.nombre}{fueRetrasada ? " !!" : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {retrasadas.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: "0.8rem", color: "#6b7280", padding: "8px 12px", background: "#f9fafb", borderRadius: 8 }}>
                          <strong>Materias reubicadas:</strong>{" "}
                          {retrasadas.map((r) => `${r.codigo} (${r.periodoOrigen.replace(/(\d)C/, '$1 C')} → ${r.periodoNuevo.replace(/(\d)C/, '$1 C')})`).join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {comp && (
                    <div className="comparacion-seccion" data-testid="comparacion">
                      <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#374151" }}>
                        {comp.materiasEsperadas === 0 ? (
                          <>
                            {comp.materiasCumplidasTotal > 0 ? (
                              <>
                                Tu cursada planeada aún no comenzó, pero ya aprobaste{" "}
                                <strong>{comp.materiasCumplidasTotal}</strong> de {comp.totalPlan} materias del plan
                              </>
                            ) : (
                              <>
                                El período de cursada para tu plan aún no comenzó
                                {typeof comp.totalPlan === "number" && (
                                  <span style={{ color: "#6b7280" }}> · Plan completo: {comp.totalPlan} materias</span>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            Cumpliste {comp.materiasCumplidas} de {comp.materiasEsperadas} materias previstas hasta hoy
                            {" "}({comp.porcentajeCumplimiento}%) · Estado: <strong>{comp.estado.replace("-", " ")}</strong>
                            {typeof comp.totalPlan === "number" && (
                              <span style={{ color: "#6b7280" }}> · Plan completo: {comp.totalPlan} materias</span>
                            )}
                          </>
                        )}
                      </p>
                      {comp.periodos && comp.periodos.length > 0 && (
                        <div>
                          <h4>Comparativa con tu plan propuesto originalmente:</h4>
                          {comp.periodos.map((p) => {
                            const cerrado = p.cumplidas >= p.totalMaterias;
                            return (
                              <div
                                key={`${p.anio}-${p.cuatrimestre}`}
                                className={`comparacion-periodo ${p.transcurrido ? 'transcurrido' : 'futuro'} ${p.transcurrido && cerrado ? 'completo' : ''} ${p.transcurrido && !cerrado ? 'pendiente' : ''}`}
                              >
                                <span className="periodo-titulo">{p.anio} - {p.cuatrimestre === 0 ? "Anual" : `${p.cuatrimestre}C`}:</span>{" "}
                                {p.transcurrido ? (
                                  <>
                                    planeaste {p.totalMaterias}, cumpliste {p.cumplidas}
                                    {p.materiasCumplidas.length > 0 && (
                                      <span style={{ color: "#166534" }}> ({p.materiasCumplidas.map((m) => m.codigo).join(", ")})</span>
                                    )}
                                    {p.materiasAtrasadas.length > 0 && (
                                      <span> · {p.materiasAtrasadas.length === 1 ? "pendiente" : "pendientes"} {p.materiasAtrasadas.length}: {p.materiasAtrasadas.map((m, i) => (
                                        <span key={m.codigo}>
                                          {i > 0 && ", "}{m.codigo} (<span style={{
                                            color: m.estado === "Regular" ? "#ca8a04" :
                                                   m.estado === "Cursando" ? "#2563eb" :
                                                   m.estado === "Desaprobada" ? "#dc2626" :
                                                   "#6b7280"
                                          }}>{m.estado}</span>)
                                        </span>
                                      ))}</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span>planeaste {p.totalMaterias} {p.totalMaterias === 1 ? "materia" : "materias"}: {p.materiasAtrasadas.map((m) => m.codigo).join(", ")}</span>
                                    <br />
                                    <span className="materia-estado">Esta cursada aún no transcurrió. Esperá a que empiece el período para cursar.</span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmación para Finales */}
      {showFinalModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>¿Confirmar baja de final?</h2>
            <p>
              ¿Estás seguro de que quieres darte de baja del final de <strong>{finalToDelete?.nombre}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeFinalModal}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={confirmDarseDeBajaFinal}>
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar nota de Final */}
      {showGradeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Registrar Resultado de Final</h2>
            <p>Materia: <strong>{finalToGrade?.nombre}</strong></p>
            
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nota (1-10):</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={gradeResult.nota}
                  onChange={(e) => setGradeResult({...gradeResult, nota: parseInt(e.target.value), ausente: false})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  disabled={gradeResult.ausente}
                />
                {!gradeResult.ausente && gradeResult.nota && previewEstadoFinal(gradeResult.nota) && (
                  <span style={{
                    display: 'inline-block', marginTop: 6, padding: '4px 10px',
                    borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: '#e0e7ff', color: '#4338ca'
                  }}>
                    Estado: {previewEstadoFinal(gradeResult.nota)}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={gradeResult.ausente}
                    onChange={(e) => setGradeResult({...gradeResult, ausente: e.target.checked})}
                  />
                  Ausente
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeGradeModal}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={registrarNotaFinal}>
                Guardar Resultado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicAssistant;
