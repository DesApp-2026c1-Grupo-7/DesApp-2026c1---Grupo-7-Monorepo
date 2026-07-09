import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Flag,
  GraduationCap,
  LibraryBig,
  Users,
  BarChart3,
} from "lucide-react";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

interface MateriaAprobadaPorCarreraItem {
  _id: string;
  aprobadas: number;
}

interface MateriasAprobadasPorCarrera {
  distribucion: MateriaAprobadaPorCarreraItem[];
  totalAprobadas: number;
}

interface UserAccount {
  role: "student" | "admin";
  suspendido?: boolean;
}

interface Report {
  estado: "pendiente" | "revisado" | "ignorado";
}

interface DashboardStats {
  students: number;
  careers: number;
  subjects: number;
  pendingReports: number;
}

interface DistribucionItem {
  _id: number;
  alumnos: number;
}

interface MateriasPorAlumno {
  distribucion: DistribucionItem[];
  totalAlumnos: number;
}

interface CarreraDistribucionItem {
  _id: string;
  cursadas: number;
}

interface MateriasPorCarrera {
  distribucion: CarreraDistribucionItem[];
  totalCursadas: number;
}

interface MateriaTopItem {
  _id: string;
  nombre: string;
  codigo: string;
  carrera: string;
  cantidad: number;
}

interface MateriasTopResponse {
  materias: MateriaTopItem[];
  totalMateriales: number;
}

interface PeriodoItem {
  periodo: string;
  creadas: number;
  activas: number;
  finalizadas: number;
  canceladas: number;
}

interface SesionesPorPeriodo {
  periodos: PeriodoItem[];
  totalSesiones: number;
  totales: { activas: number; finalizadas: number; canceladas: number };
}

interface MaterialValoradoItem {
  _id: string;
  titulo: string;
  tipo: string;
  puntaje: number;
  likes: number;
  dislikes: number;
  totalValoraciones: number;
}

interface MateriaTopValorada {
  _id: string;
  nombreMateria: string;
  codigoMateria: string;
  totalMateriales: number;
  materiales: MaterialValoradoItem[];
}

interface TopRatedResponse {
  materias: MateriaTopValorada[];
}

interface ReportMotivoItem {
  _id: string;
  cantidad: number;
}

interface ReportPeriodoItem {
  _id: string;
  cantidad: number;
}

interface ReportStatsResponse {
  totalDenuncias: number;
  totales: { pendiente: number; revisado: number; ignorado: number };
  porMotivo: ReportMotivoItem[];
  porPeriodo: ReportPeriodoItem[];
  materialesConDenuncias: number;
}

interface ConexionEstudiante {
  _id: string;
  nombre: string;
  email: string;
  cantidadContactos: number;
}

interface ConexionEstudiantesResponse {
  estudiantes: ConexionEstudiante[];
  totalEstudiantes: number;
  totalConexiones: number;
  promedioConexiones: number;
}

interface CarreraComunidadItem {
  _id: string;
  nombre: string;
  codigo: string;
  estudiantes: number;
  conexiones: number;
  sesiones: number;
  materiales: number;
}

interface ComunidadActivaResponse {
  carreras: CarreraComunidadItem[];
  totales: { estudiantes: number; conexiones: number; sesiones: number; materiales: number };
}

interface SessionUtilizationResponse {
  totalSesiones: number;
  porEstado: { activa: number; finalizada: number; cancelada: number };
  porTipo: { virtual: number; presencial: number };
  totalParticipantes: number;
  totalCupos: number;
  sesionesConCupo: number;
  sesionesSinCupo: number;
  promedioParticipantes: number;
  ocupacionPromedio: number;
  solicitudesPendientes: number;
  materiasTop: { nombre: string; sesiones: number }[];
}

const EMPTY_STATS: DashboardStats = {
  students: 0,
  careers: 0,
  subjects: 0,
  pendingReports: 0,
};

const ADMIN_ACTIONS = [
  { to: "/admin/usuarios", label: "Gestionar usuarios", description: "Roles, accesos y estados", icon: Users },
  { to: "/admin/carreras", label: "Configurar carreras", description: "Carreras y datos institucionales", icon: BookOpen },
  { to: "/admin/studyplans", label: "Planes de estudio", description: "Requisitos, materias y correlativas", icon: GraduationCap },
  { to: "/admin/moderation", label: "Revisar moderación", description: "Denuncias y contenido reportado", icon: Flag },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [distribucion, setDistribucion] = useState<MateriasPorAlumno | null>(null);
  const [loadingDistribucion, setLoadingDistribucion] = useState(true);
  const [distribucionAprobadas, setDistribucionAprobadas] = useState<MateriasPorAlumno | null>(null);
  const [loadingDistribucionAprobadas, setLoadingDistribucionAprobadas] = useState(true);
  const [distribucionPorCarrera, setDistribucionPorCarrera] = useState<MateriasPorCarrera | null>(null);
  const [loadingDistribucionPorCarrera, setLoadingDistribucionPorCarrera] = useState(true);
  const [aprobadasPorCarrera, setAprobadasPorCarrera] = useState<MateriasAprobadasPorCarrera | null>(null);
  const [loadingAprobadasPorCarrera, setLoadingAprobadasPorCarrera] = useState(true);
  const [materiasTop, setMateriasTop] = useState<MateriasTopResponse | null>(null);
  const [loadingMateriasTop, setLoadingMateriasTop] = useState(true);
  const [sesionesPorPeriodo, setSesionesPorPeriodo] = useState<SesionesPorPeriodo | null>(null);
  const [loadingSesionesPeriodo, setLoadingSesionesPeriodo] = useState(true);
  const [topRated, setTopRated] = useState<TopRatedResponse | null>(null);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [reportStats, setReportStats] = useState<ReportStatsResponse | null>(null);
  const [loadingReportStats, setLoadingReportStats] = useState(true);
  const [conexionEstudiantes, setConexionEstudiantes] = useState<ConexionEstudiantesResponse | null>(null);
  const [loadingConexion, setLoadingConexion] = useState(true);
  const [sessionUtilization, setSessionUtilization] = useState<SessionUtilizationResponse | null>(null);
  const [loadingSessionUtil, setLoadingSessionUtil] = useState(true);
  const [comunidadActiva, setComunidadActiva] = useState<ComunidadActivaResponse | null>(null);
  const [loadingComunidad, setLoadingComunidad] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/usuarios"),
      api.get("/carreras"),
      api.get("/materias"),
      api.get("/denuncias"),
    ])
      .then(([usersResponse, careersResponse, subjectsResponse, reportsResponse]) => {
        if (!active) return;
        const users = usersResponse.data as UserAccount[];
        const reports = reportsResponse.data as Report[];
        setStats({
          students: users.filter((user) => user.role === "student" && !user.suspendido).length,
          careers: careersResponse.data.length,
          subjects: subjectsResponse.data.length,
          pendingReports: reports.filter((report) => report.estado === "pendiente").length,
        });
      })
      .catch(() => {
        if (active) setError("No se pudo actualizar el resumen del sistema.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    api.get("/academico/admin/materias-por-alumno")
      .then((res) => {
        if (active) setDistribucion(res.data as MateriasPorAlumno);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingDistribucion(false);
      });

    api.get("/academico/admin/materias-aprobadas-por-alumno")
      .then((res) => {
        if (active) setDistribucionAprobadas(res.data as MateriasPorAlumno);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingDistribucionAprobadas(false);
      });

    api.get("/academico/admin/materias-cursadas-por-carrera")
      .then((res) => {
        if (active) setDistribucionPorCarrera(res.data as MateriasPorCarrera);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingDistribucionPorCarrera(false);
      });

    api.get("/academico/admin/materias-aprobadas-por-carrera")
      .then((res) => {
        if (active) setAprobadasPorCarrera(res.data as MateriasAprobadasPorCarrera);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAprobadasPorCarrera(false);
      });

    api.get("/materiales/admin/materias-top")
      .then((res) => {
        if (active) setMateriasTop(res.data as MateriasTopResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingMateriasTop(false);
      });

    api.get("/sesiones/admin/sesiones-por-periodo")
      .then((res) => {
        if (active) setSesionesPorPeriodo(res.data as SesionesPorPeriodo);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSesionesPeriodo(false);
      });

    api.get("/materiales/admin/materiales-top-valorados")
      .then((res) => {
        if (active) setTopRated(res.data as TopRatedResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingTopRated(false);
      });

    api.get("/denuncias/stats")
      .then((res) => {
        if (active) setReportStats(res.data as ReportStatsResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingReportStats(false);
      });

    api.get("/invitaciones/admin/conexion-estudiantes")
      .then((res) => {
        if (active) setConexionEstudiantes(res.data as ConexionEstudiantesResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingConexion(false);
      });

    api.get("/sesiones/admin/utilizacion")
      .then((res) => {
        if (active) setSessionUtilization(res.data as SessionUtilizationResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSessionUtil(false);
      });

    api.get("/carreras/admin/comunidad-activa")
      .then((res) => {
        if (active) setComunidadActiva(res.data as ComunidadActivaResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingComunidad(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const statItems = [
    { value: stats.students, label: "Estudiantes activos", tone: "blue" },
    { value: stats.careers, label: "Carreras", tone: "purple" },
    { value: stats.subjects, label: "Materias", tone: "green" },
    { value: stats.pendingReports, label: "Denuncias pendientes", tone: "warning" },
  ];

  const rankBadge = (i: number) => {
    if (i === 0) return <span className="admin-rank-badge gold">1</span>;
    if (i === 1) return <span className="admin-rank-badge silver">2</span>;
    if (i === 2) return <span className="admin-rank-badge bronze">3</span>;
    return <span className="admin-rank-badge">{i + 1}</span>;
  };

  const progressBar = (pct: number, color = "") => (
    <div className="admin-progress-cell">
      <span>{pct.toFixed(1)}%</span>
      <div className="admin-progress-bar">
        <div className={`admin-progress-fill ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="admin-container admin-dashboard">
      <div className="admin-dashboard-heading">
        <div>
          <span className="admin-dashboard-kicker">Resumen institucional</span>
          <h1>Panel de Administración</h1>
          <p>Datos actuales y accesos para gestionar la plataforma.</p>
        </div>
        <span className="system-status"><span /> Sistema operativo</span>
      </div>

      {error && <div className="admin-dashboard-alert">{error}</div>}

      <div className="admin-dashboard-stats" aria-label="Resumen del sistema">
        {statItems.map((item) => (
          <div className={`admin-stat ${item.tone}`} key={item.label}>
            <strong>{loading ? "—" : item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><BarChart3 size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Materias cursadas por alumno</h2>
            <p>Distribución de la cantidad de materias que cursa cada estudiante.</p>
          </div>
          {distribucion && (
            <span className="admin-distribucion-total">
              {distribucion.totalAlumnos} alumnos
            </span>
          )}
        </div>

        {loadingDistribucion ? (
          <p className="admin-distribucion-loading">Cargando distribución…</p>
        ) : distribucion && distribucion.distribucion.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>Materias cursadas</th>
                  <th>Alumno/s</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {distribucion.distribucion.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Materias cursadas">{item._id === 1 ? "1 materia" : `${item._id} materias`}</td>
                    <td data-label="Alumno/s"><strong>{item.alumnos.toLocaleString()}</strong></td>
                    <td data-label="Porcentaje">{progressBar((item.alumnos / distribucion.totalAlumnos) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay datos de materias cursadas.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><BarChart3 size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Materias aprobadas por alumno</h2>
            <p>Distribución de la cantidad de materias que aprobó cada estudiante.</p>
          </div>
          {distribucionAprobadas && (
            <span className="admin-distribucion-total">
              {distribucionAprobadas.totalAlumnos} alumnos
            </span>
          )}
        </div>

        {loadingDistribucionAprobadas ? (
          <p className="admin-distribucion-loading">Cargando distribución…</p>
        ) : distribucionAprobadas && distribucionAprobadas.distribucion.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>Materias aprobadas</th>
                  <th>Alumno/s</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {distribucionAprobadas.distribucion.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Materias aprobadas">{item._id === 1 ? "1 materia" : `${item._id} materias`}</td>
                    <td data-label="Alumno/s"><strong>{item.alumnos.toLocaleString()}</strong></td>
                    <td data-label="Porcentaje">{progressBar((item.alumnos / distribucionAprobadas.totalAlumnos) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay datos de materias aprobadas.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><BarChart3 size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Materias cursadas por carrera</h2>
            <p>Todas las cursadas registradas por estudiantes de cada carrera.</p>
          </div>
          {distribucionPorCarrera && (
            <span className="admin-distribucion-total">
              {distribucionPorCarrera.totalCursadas} cursadas
            </span>
          )}
        </div>

        {loadingDistribucionPorCarrera ? (
          <p className="admin-distribucion-loading">Cargando distribución…</p>
        ) : distribucionPorCarrera && distribucionPorCarrera.distribucion.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Materias cursadas</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {distribucionPorCarrera.distribucion.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Carrera"><strong>{item._id}</strong></td>
                    <td data-label="Materias cursadas"><strong>{item.cursadas.toLocaleString()}</strong></td>
                    <td data-label="Porcentaje">{progressBar((item.cursadas / distribucionPorCarrera.totalCursadas) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay datos de cursadas por carrera.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><BarChart3 size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Materias aprobadas por carrera</h2>
            <p>Todas las materias aprobadas por estudiantes de cada carrera.</p>
          </div>
          {aprobadasPorCarrera && (
            <span className="admin-distribucion-total">
              {aprobadasPorCarrera.totalAprobadas} aprobadas
            </span>
          )}
        </div>

        {loadingAprobadasPorCarrera ? (
          <p className="admin-distribucion-loading">Cargando distribución…</p>
        ) : aprobadasPorCarrera && aprobadasPorCarrera.distribucion.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Materias aprobadas</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {aprobadasPorCarrera.distribucion.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Carrera"><strong>{item._id}</strong></td>
                    <td data-label="Materias aprobadas"><strong>{item.aprobadas.toLocaleString()}</strong></td>
                    <td data-label="Porcentaje">{progressBar((item.aprobadas / aprobadasPorCarrera.totalAprobadas) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay datos de aprobadas por carrera.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><LibraryBig size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Materias con más materiales</h2>
            <p>Ranking de materias con mayor cantidad de recursos compartidos en el repositorio.</p>
          </div>
          {materiasTop && (
            <span className="admin-distribucion-total">
              {materiasTop.totalMateriales} materiales
            </span>
          )}
        </div>

        {loadingMateriasTop ? (
          <p className="admin-distribucion-loading">Cargando ranking…</p>
        ) : materiasTop && materiasTop.materias.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Materia</th>
                  <th>Carrera</th>
                  <th>Materiales</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {materiasTop.materias.map((item, i) => (
                  <tr key={item._id}>
                    <td className="admin-rank" data-label="#">{rankBadge(i)}</td>
                    <td data-label="Materia"><strong>{item.nombre}</strong> <span className="admin-materia-code">{item.codigo}</span></td>
                    <td data-label="Carrera">{item.carrera}</td>
                    <td className="admin-rank-count" data-label="Materiales"><strong>{item.cantidad}</strong></td>
                    <td data-label="Porcentaje">{progressBar((item.cantidad / materiasTop.totalMateriales) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay materiales compartidos todavía.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><BarChart3 size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Sesiones de estudio creadas por período</h2>
            <p>Distribución mensual de sesiones de estudio creadas en la plataforma.</p>
          </div>
          {sesionesPorPeriodo && (
            <span className="admin-distribucion-total">
              {sesionesPorPeriodo.totalSesiones} sesiones
            </span>
          )}
        </div>

        {loadingSesionesPeriodo ? (
          <p className="admin-distribucion-loading">Cargando sesiones…</p>
        ) : sesionesPorPeriodo && sesionesPorPeriodo.periodos.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Creadas</th>
                  <th>Activas</th>
                  <th>Finalizadas</th>
                  <th>Canceladas</th>
                </tr>
              </thead>
              <tbody>
                {sesionesPorPeriodo.periodos.map((item) => {
                  const [year, month] = item.periodo.split("-");
                  const date = new Date(Number(year), Number(month) - 1);
                  const label = date.toLocaleDateString("es-AR", { year: "numeric", month: "long" });

                  return (
                    <tr key={item.periodo}>
                      <td data-label="Período"><strong>{label}</strong></td>
                      <td className="admin-rank-count" data-label="Creadas">
                        <span className="admin-badge green">{item.creadas}</span>
                      </td>
                      <td className="admin-rank-count" data-label="Activas">
                        <span className="admin-badge blue">{item.activas}</span>
                      </td>
                      <td className="admin-rank-count" data-label="Finalizadas">
                        <span className="admin-badge gray">{item.finalizadas}</span>
                      </td>
                      <td className="admin-rank-count" data-label="Canceladas">
                        <span className="admin-badge red">{item.canceladas}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay sesiones de estudio registradas.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><LibraryBig size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Materiales más valorados por materia</h2>
            <p>Top 3 materiales mejor puntuados dentro de cada materia del repositorio.</p>
          </div>
        </div>

        {loadingTopRated ? (
          <p className="admin-distribucion-loading">Cargando valoraciones…</p>
        ) : topRated && topRated.materias.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table admin-top-rated-table">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Material</th>
                  <th>Tipo</th>
                  <th>👍</th>
                  <th>👎</th>
                </tr>
              </thead>
              <tbody>
                {topRated.materias.map((materia) =>
                  materia.materiales.map((mat, idx) => (
                    <tr key={mat._id}>
                      {idx === 0 && (
                        <td className="admin-materia-group-name" rowSpan={materia.materiales.length} data-label="Materia">
                          <strong>{materia.nombreMateria}</strong>
                          <span className="admin-materia-code">{materia.codigoMateria}</span>
                        </td>
                      )}
                      <td data-label="Material">{mat.titulo}</td>
                      <td className="admin-rank-count" data-label="Tipo">
                        <span className={`admin-badge ${mat.tipo === 'archivo' ? 'blue' : 'orange'}`}>
                          {mat.tipo === 'archivo' ? 'Archivo' : 'Link'}
                        </span>
                      </td>
                      <td className="admin-rank-count" data-label="👍">
                        <span className="admin-puntaje positive">👍 {mat.likes}</span>
                      </td>
                      <td className="admin-rank-count" data-label="👎">
                        <span className="admin-puntaje negative">👎 {mat.dislikes}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay materiales valorados todavía.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><Flag size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Estadísticas de denuncias y moderación</h2>
            <p>Resumen de actividad de denuncias y moderación de contenido.</p>
          </div>
          {reportStats && (
            <span className="admin-distribucion-total">
              {reportStats.totalDenuncias} denuncias
            </span>
          )}
        </div>

        {loadingReportStats ? (
          <p className="admin-distribucion-loading">Cargando estadísticas…</p>
        ) : reportStats ? (
          <>
            <div className="admin-report-mini-stats">
              <div className="admin-report-mini-card warning">
                <strong>{reportStats.totales.pendiente}</strong>
                <span>Denuncias Pendientes</span>
              </div>
              <div className="admin-report-mini-card success">
                <strong>{reportStats.totales.revisado}</strong>
                <span>Denuncias Aceptadas</span>
              </div>
              <div className="admin-report-mini-card muted">
                <strong>{reportStats.totales.ignorado}</strong>
                <span>Denuncias Rechazadas</span>
              </div>
              <div className="admin-report-mini-card info">
                <strong>{reportStats.materialesConDenuncias}</strong>
                <span>Materiales con Denuncias</span>
              </div>
            </div>

            {reportStats.porMotivo.length > 0 && (
              <div className="admin-distribucion-table-wrapper" style={{ marginBottom: '1rem' }}>
                <table className="admin-distribucion-table">
                  <caption className="admin-report-table-caption">Denuncias por motivo</caption>
                  <thead>
                    <tr>
                      <th>Motivo</th>
                      <th>Cantidad</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportStats.porMotivo.map((item) => (
                      <tr key={item._id}>
                        <td data-label="Motivo">{item._id}</td>
                        <td className="admin-rank-count" data-label="Cantidad"><strong>{item.cantidad}</strong></td>
                        <td data-label="%">{progressBar((item.cantidad / reportStats.totalDenuncias) * 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportStats.porPeriodo.length > 0 && (
              <div className="admin-distribucion-table-wrapper">
                <table className="admin-distribucion-table">
                  <caption className="admin-report-table-caption">Denuncias por período</caption>
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Denuncias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportStats.porPeriodo.map((item) => {
                      const [year, month] = item._id.split("-");
                      const date = new Date(Number(year), Number(month) - 1);
                      const label = date.toLocaleDateString("es-AR", { year: "numeric", month: "long" });
                      return (
                        <tr key={item._id}>
                          <td data-label="Período"><strong>{label}</strong></td>
                          <td data-label="Denuncias">
                            <span className="admin-badge red">{item.cantidad}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="admin-distribucion-loading">No hay denuncias registradas.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><Users size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Reportes sociales</h2>
            <p>Conexiones y actividad entre estudiantes en la red social académica.</p>
          </div>
        </div>

        <div className="admin-report-mini-stats">
          {conexionEstudiantes && (
            <>
              <div className="admin-report-mini-card info">
                <strong>{conexionEstudiantes.totalEstudiantes}</strong>
                <span>Estudiantes</span>
              </div>
              <div className="admin-report-mini-card success">
                <strong>{conexionEstudiantes.totalConexiones}</strong>
                <span>Conexiones totales</span>
              </div>
              <div className="admin-report-mini-card warning">
                <strong>{conexionEstudiantes.promedioConexiones}</strong>
                <span>Promedio por estudiante</span>
              </div>
            </>
          )}
        </div>

        <h3 className="admin-social-subtitle">Conexión entre estudiantes</h3>

        {loadingConexion ? (
          <p className="admin-distribucion-loading">Cargando conexiones…</p>
        ) : conexionEstudiantes && conexionEstudiantes.estudiantes.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Email</th>
                  <th>Contactos</th>
                </tr>
              </thead>
              <tbody>
                {conexionEstudiantes.estudiantes.map((est, i) => (
                  <tr key={est._id}>
                    <td className="admin-rank" data-label="#">{rankBadge(i)}</td>
                    <td data-label="Estudiante"><strong>{est.nombre}</strong></td>
                    <td className="admin-social-email" data-label="Email">{est.email}</td>
                    <td className="admin-rank-count" data-label="Contactos">
                      <span className="admin-badge blue">{est.cantidadContactos}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay estudiantes registrados.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><GraduationCap size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Utilización de sesiones de estudio</h2>
            <p>Participación, ocupación y actividad en las sesiones colaborativas.</p>
          </div>
          {sessionUtilization && (
            <span className="admin-distribucion-total">
              {sessionUtilization.totalSesiones} sesiones
            </span>
          )}
        </div>

        {loadingSessionUtil ? (
          <p className="admin-distribucion-loading">Cargando datos de sesiones…</p>
        ) : sessionUtilization ? (
          <>
            <div className="admin-report-mini-stats">
              <div className="admin-report-mini-card info">
                <strong>{sessionUtilization.totalParticipantes}</strong>
                <span>Participantes totales</span>
              </div>
              <div className="admin-report-mini-card success">
                <strong>{sessionUtilization.promedioParticipantes}</strong>
                <span>Promedio de Participación por Sesión</span>
              </div>
              <div className="admin-report-mini-card warning">
                <strong>{sessionUtilization.ocupacionPromedio}%</strong>
                <span>Porcentaje de Participación Total</span>
              </div>
              <div className="admin-report-mini-card muted">
                <strong>{sessionUtilization.solicitudesPendientes}</strong>
                <span>Solicitudes pendientes a Sesiones</span>
              </div>
            </div>

            <div className="admin-utilization-tables">
            <div className="admin-distribucion-table-wrapper" style={{ marginBottom: '1rem' }}>
              <table className="admin-distribucion-table">
                <caption className="admin-report-table-caption">Sesiones por estado</caption>
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Sesiones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td data-label="Estado">Activas</td><td className="admin-rank-count" data-label="Sesiones"><span className="admin-badge blue">{sessionUtilization.porEstado.activa}</span></td></tr>
                  <tr><td data-label="Estado">Finalizadas</td><td className="admin-rank-count" data-label="Sesiones"><span className="admin-badge gray">{sessionUtilization.porEstado.finalizada}</span></td></tr>
                  <tr><td data-label="Estado">Canceladas</td><td className="admin-rank-count" data-label="Sesiones"><span className="admin-badge red">{sessionUtilization.porEstado.cancelada}</span></td></tr>
                </tbody>
              </table>
            </div>
            <div className="admin-distribucion-table-wrapper" style={{ marginBottom: '1rem' }}>
              <table className="admin-distribucion-table">
                <caption className="admin-report-table-caption">Sesiones por tipo</caption>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Sesiones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td data-label="Tipo">Virtuales</td><td className="admin-rank-count" data-label="Sesiones"><span className="admin-badge blue">{sessionUtilization.porTipo.virtual}</span></td></tr>
                  <tr><td data-label="Tipo">Presenciales</td><td className="admin-rank-count" data-label="Sesiones"><span className="admin-badge orange">{sessionUtilization.porTipo.presencial}</span></td></tr>
                </tbody>
              </table>
            </div>
            {sessionUtilization.materiasTop.length > 0 && (
              <div className="admin-distribucion-table-wrapper" style={{ marginBottom: '1rem' }}>
                <table className="admin-distribucion-table">
                  <caption className="admin-report-table-caption">Materias con más sesiones</caption>
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Sesiones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionUtilization.materiasTop.map((m) => (
                      <tr key={m.nombre}>
                        <td data-label="Materia">{m.nombre}</td>
                        <td className="admin-rank-count" data-label="Sesiones"><strong>{m.sesiones}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="admin-distribucion-table-wrapper">
              <table className="admin-distribucion-table">
                <caption className="admin-report-table-caption">Capacidad</caption>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th className="admin-rank-count">Sesiones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td data-label="Tipo">Sesiones con cupo limitado</td><td className="admin-rank-count" data-label="Sesiones"><span className="admin-badge green">{sessionUtilization.sesionesConCupo}</span></td></tr>
                  <tr><td data-label="Tipo">Sesiones sin cupo limitado</td><td className="admin-rank-count" data-label="Sesiones"><span className="admin-badge gray">{sessionUtilization.sesionesSinCupo}</span></td></tr>
                </tbody>
              </table>
            </div>
            </div>
          </>
        ) : (
          <p className="admin-distribucion-loading">No hay sesiones de estudio registradas.</p>
        )}
      </section>

      <section className="admin-dashboard-section admin-distribucion-section">
        <div className="admin-section-title">
          <div>
            <h2><GraduationCap size={18} style={{ marginRight: 6, verticalAlign: -2 }} /> Carreras con comunidad más activa</h2>
            <p>Carreras ordenadas por cantidad de estudiantes, con actividad en sesiones, materiales y conexiones.</p>
          </div>
          {comunidadActiva && (
            <span className="admin-distribucion-total">
              {comunidadActiva.totales.estudiantes} estudiantes
            </span>
          )}
        </div>

        {loadingComunidad ? (
          <p className="admin-distribucion-loading">Cargando comunidades…</p>
        ) : comunidadActiva && comunidadActiva.carreras.length > 0 ? (
          <div className="admin-distribucion-table-wrapper">
            <table className="admin-distribucion-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Carrera</th>
                  <th>Estudiantes</th>
                  <th>Conexiones</th>
                  <th>Sesiones</th>
                  <th>Materiales</th>
                </tr>
              </thead>
              <tbody>
                {comunidadActiva.carreras.map((c, i) => (
                  <tr key={c._id}>
                    <td className="admin-rank" data-label="#">{rankBadge(i)}</td>
                    <td data-label="Carrera"><strong>{c.nombre}</strong></td>
                    <td className="admin-rank-count" data-label="Estudiantes"><span className="admin-badge blue">{c.estudiantes}</span></td>
                    <td className="admin-rank-count" data-label="Conexiones">{c.conexiones}</td>
                    <td className="admin-rank-count" data-label="Sesiones">{c.sesiones}</td>
                    <td className="admin-rank-count" data-label="Materiales">{c.materiales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-distribucion-loading">No hay carreras registradas.</p>
        )}
      </section>

      <section className="admin-dashboard-section">
        <div className="admin-section-title">
          <div>
            <h2>Gestión rápida</h2>
            <p>Ingresá directamente al módulo que necesitás.</p>
          </div>
        </div>

        <div className="admin-action-grid">
          {ADMIN_ACTIONS.map(({ to, label, description, icon: Icon }) => (
            <Link className="admin-action" to={to} key={to}>
              <span className="admin-action-icon"><Icon size={21} /></span>
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-platform-card">
        <span className="admin-platform-icon"><LibraryBig size={24} /></span>
        <div>
          <h2>Configuración académica centralizada</h2>
          <p>Las carreras, planes, materias y ofertas comparten una única fuente de datos.</p>
        </div>
        <Link to="/admin/ofertas">Ver oferta académica <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
