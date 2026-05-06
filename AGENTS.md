# AGENTS.md - Plan de trabajo del Grupo 7

> Guia para agentes de IA y para el equipo humano.

## RULE 0 - Cerrar lo que se hace

Cada vez que un agente termine una tarea debe:

1. Mover la card de Trello a `Hecho en este sprint` y completar su Definition of Done.
2. Abrir o actualizar PR hacia `dev`, dejar CI verde y pedir review antes de mergear.
3. Actualizar este archivo si cambia el plan.
4. Hacer push antes de cerrar la sesion.

Si algo no se cerro del todo, crear una card nueva y dejarlo explicitamente documentado.

## Cronograma

| Fecha | Hito |
|---|---|
| 07/05 | Sprint 1 review + Sprint 2 planning |
| 21/05 | Sprint 2 review + Sprint 3 planning |
| 04/06 | Sprint 3 review + Sprint 4 planning |
| 11/06 | Presentacion medio termino |
| 25/06 | Sprint 4 review + Sprint 5 planning |
| 16/07 | Sprint 5 review |
| 23/07 | Presentacion final |

## Equipo

| Integrante | GitHub | Foco principal | Backup |
|---|---|---|---|
| Thomas Casco | @ThomasCasco | Backend + coordinacion + DevOps | Frontend |
| Santino Galdin | @SantinoGaldin1 | Backend + modelado de datos | Backend |
| Matias Lopez | @Matias1345 | Frontend | Frontend |
| Marcos Bejarano | @Marcos0129 | Analisis + UX + frontend liviano | Docs |

## Estado actual al 06/05/2026

La deuda de Sprint 1 sobre los puntos 1 a 4 queda cerrada en la rama `feature/cerrar-deuda-puntos-1-4`.

Hecho:

- PR #10 mergeado a `dev` con CI verde.
- Comentarios de review del PR #10 corregidos.
- Punto 1: registro estudiante, login JWT, seed admin, alta de admins por admin, listado de cuentas, suspension/reactivacion.
- Punto 2: CRUD carreras/planes/materias, correlativas, creditos, UNAHUR/optativas, titulo/instituto/duracion de carrera, estado de plan.
- Punto 3: situacion academica, carga manual, Excel preview/correccion/confirmacion, inscripciones, cierre de cuatrimestre, finales y actividades con creditos.
- Punto 4: inscribibles, finales con intentos/vencimiento, avance, analisis por anio, oferta academica, que-pasa-si y planificador por horas.
- Tests reales de backend en `backend/test/sprint1-debt.test.js`.
- UI minima conectada para usuarios admin, oferta academica, Excel preview, actividades con creditos y asistente.

Validacion:

- `cd backend && npm test`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

## Backlog por punto del TP

### Punto 1 - Gestion de Usuarios

- [x] Modelo `User` con roles `student` / `admin`.
- [x] Registro de estudiante.
- [x] Login con JWT.
- [x] Seed del admin inicial.
- [x] Admin da de alta otros admins.
- [x] Admin lista todas las cuentas.
- [x] Admin suspende/reactiva cuentas.
- [x] Tests de auth/autorizacion.
- [x] Decision documentada: se usa `role` en lugar de discriminators explicitos porque alcanza para el alcance actual y simplifica autorizacion.

### Punto 2 - Configuracion Academica

- [x] CRUD Carreras.
- [x] Carrera con nombre, titulo, instituto y duracion estimada.
- [x] CRUD Planes de estudio.
- [x] Estado de plan: Vigente, En transicion, Discontinuado.
- [x] Una carrera puede tener varios planes.
- [x] Carga de materias en un plan.
- [x] Materias con anio y cuatrimestre/anual.
- [x] Condiciones: UNAHUR, ingles, creditos y optativas.
- [x] Correlatividades.
- [x] Tests de CRUD academico/correlatividades.

### Punto 3 - Gestion de Situacion Academica

- [x] Modelo `Grade` por estudiante/materia.
- [x] Carga manual desde UI.
- [x] Carga Excel/CSV con preview.
- [x] Errores visibles y correccion antes de confirmar.
- [x] Inscripcion a materias al inicio de cuatrimestre.
- [x] Registro de resultado de cuatrimestre.
- [x] Registro de presentaciones a finales.
- [x] Actividades con creditos.
- [x] Tests de situacion, importacion, inscripcion y finales.

### Punto 4 - Asistente Academico

- [x] Materias en las que puede inscribirse respetando correlatividades.
- [x] Finales pendientes con intentos y vencimiento de regularidad.
- [x] Creditos faltantes y materias UNAHUR faltantes.
- [x] Analisis por anio.
- [x] Porcentaje de avance.
- [x] Oferta academica por periodo y filtro de inscribibles.
- [x] Que-pasa-si.
- [x] Planificador por horas/semana.
- [x] Carga horaria visible por cuatrimestre.
- [x] Tests de algoritmos del asistente.
- [ ] Plus: comparar rendimiento real vs plan.
- [ ] Plus: guardar varios planes.

### Punto 5 - Red Social Academica

- [ ] Perfil de estudiante con datos, carrera/s, situacion y foto.
- [ ] Privacidad publico/privado.
- [ ] Toggles de email, situacion academica y publicacion de eventos.
- [ ] Invitaciones por email.
- [ ] Aceptar/rechazar via link con login previo.
- [ ] Aviso si destinatario no esta registrado.
- [ ] Mis contactos y solicitudes pendientes.
- [ ] Feed de eventos academicos y posteos manuales.

### Punto 6 - Sesiones de Estudio Colaborativo

- [ ] Crear sesion con todos los campos de la consigna.
- [ ] Visibilidad segun privacidad del creador.
- [ ] Filtros de busqueda.
- [ ] Inscripcion de estudiantes.
- [ ] Aprobacion manual del creador.
- [ ] Email de confirmacion.
- [ ] Editar/cancelar con notificacion.
- [ ] Recordatorio automatico 24h antes.

### Punto 7 - Repositorio de Materiales

- [ ] Subida de archivos permitidos hasta 25MB.
- [ ] Links externos.
- [ ] Tags/metadata.
- [ ] Listado y filtros.
- [ ] Valoracion, totales, ratio y ordenamiento.
- [ ] Denuncias, motivos configurables y suspension automatica.
- [ ] Panel de moderacion admin.
- [ ] Discord card destacada.

### Punto 8 - Notificaciones

- [ ] Centro de notificaciones in-app.
- [ ] Vencimiento de regularidad.
- [ ] Eventos de sesiones.
- [ ] Eventos de denuncias.

### Punto 9 - Reportes y Estadisticas

- [ ] Usuarios activos.
- [ ] Materias cursadas/aprobadas por alumno y carrera.
- [ ] Materias con mas materiales compartidos.
- [ ] Sesiones creadas por periodo.
- [ ] Materiales mas valorados por materia.
- [ ] Estadisticas de denuncias/moderacion.
- [ ] Conexiones por estudiante.
- [ ] Utilizacion de sesiones.
- [ ] Carreras con comunidad mas activa.

## Plan por sprint actualizado

### Sprint 2 (07/05 -> 21/05) - Red social academica

Objetivo de demo: dos estudiantes editan perfil, se conectan por invitacion y ven feed.

Tareas principales:

- Perfil, foto, privacidad y toggles.
- Servicio de email.
- Invitaciones, contactos y solicitudes.
- Feed de eventos academicos y posteos.
- Tests y documentacion de demo.

Detalle: `docs/sprint-2/ficha.md`.

### Sprint 3 (21/05 -> 04/06) - Sesiones de estudio

Objetivo de demo: crear, listar, filtrar, inscribirse y gestionar sesiones con confirmaciones por email.

### Sprint 4 (04/06 -> 25/06) - Materiales base + valoraciones

Objetivo de demo: repositorio por materia con archivos/links, tags, busqueda y valoraciones.

### Sprint 5 (25/06 -> 16/07) - Moderacion, notificaciones, reportes y cierre

Objetivo de demo: app end-to-end estable, con denuncias, notificaciones, reportes, deploy y documentacion final.

## Convenciones tecnicas

- Branching: `main` <- `dev` <- `feature/*` / `fix/*` / `docs/*`.
- Nunca PR directo a `main`.
- Commits: Conventional Commits en espaniol.
- PRs contra `dev`, con CODEOWNERS y CI verde.
- Backend: Node 20 + Express 5 + Mongoose.
- Frontend: React 19 + Vite + TypeScript.
- Variables de entorno: nunca commitear `.env`.
