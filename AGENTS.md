# AGENTS.md — Plan de trabajo del Grupo 7

> **Para quién es este archivo:** cualquier agente de IA que asista a un integrante del equipo (Claude Code, Cursor, Gemini, Copilot, etc.). También sirve como brújula para los humanos.

---

## RULE 0 — Cerrar lo que se hace

Cada vez que un agente termine una tarea, antes de devolver el control al usuario debe:

1. **Marcar la card de Trello como hecha**: mover a `Hecho en este sprint` y marcar todos los ítems del checklist "Definition of Done" como `complete`. Board: https://trello.com/b/aUEcBwaC/desapp-2026c1-grupo-7
2. **Abrir o actualizar el PR hacia `dev`** (no a `main`), dejarlo con CI verde, pedir review y esperar la aprobación requerida antes de mergear, siguiendo `CONTRIBUTING.md`.
3. **Actualizar este archivo** si la tarea cambió el plan: tachar lo cerrado en el backlog, anotar lo pendiente.
4. **Hacer push** del trabajo al remoto antes de cerrar la sesión.

Si una tarea no se cerró del todo, marcar explícitamente qué quedó pendiente y crear/actualizar una card nueva. No dejar trabajo "fantasma".

---

## Cronograma del cuatrimestre

| Fecha | Hito |
|---|---|
| 07/05 | **Sprint 1 review + Sprint 2 planning** |
| 21/05 | **Sprint 2 review + Sprint 3 planning** |
| 04/06 | **Sprint 3 review + Sprint 4 planning** |
| 11/06 | **Presentación medio término** |
| 25/06 | **Sprint 4 review + Sprint 5 planning** |
| 16/07 | **Sprint 5 review** |
| 23/07 | **Presentación final** |

---

## Equipo

| Integrante | GitHub | Foco principal | Backup |
|---|---|---|---|
| Thomas Casco | @ThomasCasco | Backend + coordinación + DevOps | Frontend |
| Santino Galdín | @SantinoGaldin1 | Backend + modelado de datos | Backend |
| Matías López | @Matias1345 | Frontend (React) | Frontend |
| Marcos Bejarano | @Marcos0129 | Análisis + UX + frontend liviano | Docs |

Reglas de asignación:
- Cada card de Trello tiene un dueño único.
- Si alguien queda sin tarea, toma la siguiente del backlog priorizado.
- Bloqueos se avisan en el grupo el mismo día.

---

## Estado actual al 06/05/2026, post-merge PR #10

La ficha original de Sprint 1 pedía llegar a una versión preliminar funcional hasta el punto 4 del TP. Por eso el PR #10, aunque estaba nombrado como Sprint 2, en realidad corresponde al cierre funcional de Sprint 1.

### Ya mergeado

- Setup técnico: CI, branching, CONTRIBUTING, README, arquitectura.
- Actores y funcionalidades.
- DER definitivo.
- Frontend skeleton con navegación, login/registro y layout.
- Backend skeleton con `/api/health` y conexión Mongo.
- Auth real y guards de navegación por rol en PR #8/#9.
- PR #10 mergeado a `dev`: CRUD académico completo, situación académica, import Excel/CSV, inscripciones, finales y asistente académico básico.
- Comentarios de review del PR #10 corregidos y threads resueltos.
- CI verde en backend y frontend para el merge de PR #10.

### Pendiente crítico de Sprint 1

- Tests reales. Hoy `backend npm test` sigue siendo placeholder.
- Actualizar Trello para reflejar que el PR #10 ya fue mergeado, pero que los tests reales y faltantes de puntos 1 a 4 pasan a Sprint 2.
- Crear cards separadas para deuda de Sprint 2: tests, admin de usuarios, campos exactos de consigna, Excel preview/corrección, actividades con créditos, oferta académica, "qué pasa si" y planificador.

Ver detalle en `docs/sprint-1/cierre-sprint-1.md`.

---

## Backlog por punto del TP

### Punto 1 — Gestión de Usuarios

- [x] Modelo `User` con roles `student` / `admin`.
- [x] Registro de estudiante.
- [x] Login con JWT.
- [x] Seed del admin inicial.
- [x] Guards frontend por rol.
- [ ] Discriminators `Estudiante` / `Administrador`, o decisión documentada de usar `role`.
- [ ] Admin da de alta otros admins.
- [ ] Admin lista todas las cuentas.
- [ ] Admin suspende/reactiva cuentas.
- [ ] Tests de auth/autorización.

### Punto 2 — Configuración Académica

- [x] CRUD Carreras.
- [x] CRUD Planes de estudio.
- [x] Una carrera puede tener varios planes.
- [x] Carga de materias en un plan.
- [x] Materias con año y cuatrimestre/anual.
- [x] Correlatividades.
- [x] Créditos, materias UNAHUR y optativas.
- [x] Nivel de inglés requerido.
- [ ] Campos exactos de carrera: título, instituto, duración estimada.
- [ ] Estado de plan exacto: Vigente, En transición, Discontinuado.
- [ ] Tests de CRUD académico y correlatividades.

### Punto 3 — Gestión de Situación Académica

- [x] Modelo de situación por estudiante y materia (`Grade`).
- [x] Carga manual desde UI.
- [x] Carga desde Excel/CSV.
- [x] Inscripción a materias al inicio de cuatrimestre.
- [x] Registro de resultado de cuatrimestre.
- [x] Registro de presentaciones a finales.
- [ ] Preview real del Excel antes de confirmar.
- [ ] Corrección de filas del Excel antes de confirmar.
- [ ] Actividades con créditos.
- [ ] Tests de situación, importación, inscripción y finales.

### Punto 4 — Asistente Académico

- [x] Materias en las que puede inscribirse respetando correlatividades.
- [x] Finales pendientes.
- [x] Créditos faltantes y materias UNAHUR faltantes.
- [x] Análisis por año.
- [x] Porcentaje de avance.
- [x] Proyección básica agrupada por año/cuatrimestre.
- [ ] Vencimiento de regularidad en finales pendientes.
- [ ] Oferta académica por período y filtro de inscribibles.
- [ ] "¿Qué pasa si...?"
- [ ] Planificador de cursada por horas/semana hasta recibirse.
- [ ] Movimiento manual de materias y carga horaria por cuatrimestre.
- [ ] Plus: comparar rendimiento real vs plan.
- [ ] Plus: guardar varios planes.
- [ ] Tests de algoritmos del asistente.

### Punto 5 — Red Social Académica

- [ ] Perfil de estudiante con datos, carrera/s, situación y foto.
- [ ] Privacidad público/privado.
- [ ] Toggles de email, situación académica y publicación de eventos.
- [ ] Invitaciones por email.
- [ ] Aceptar/rechazar vía link con login previo.
- [ ] Aviso si destinatario no está registrado.
- [ ] Mis contactos y solicitudes pendientes.
- [ ] Feed de eventos académicos y posteos manuales.

### Punto 6 — Sesiones de Estudio Colaborativo

- [ ] Crear sesión con todos los campos de la consigna.
- [ ] Visibilidad según privacidad del creador.
- [ ] Filtros de búsqueda.
- [ ] Inscripción de estudiantes.
- [ ] Aprobación manual del creador.
- [ ] Email de confirmación.
- [ ] Editar/cancelar con notificación.
- [ ] Recordatorio automático 24h antes.

### Punto 7 — Repositorio de Materiales

- [ ] Subida de archivos permitidos hasta 25MB.
- [ ] Links externos.
- [ ] Tags/metadata.
- [ ] Listado y filtros.
- [ ] Valoración pulgar arriba/abajo, totales, ratio y ordenamiento.
- [ ] Denuncias, motivos configurables, suspensión automática.
- [ ] Panel de moderación admin.
- [ ] Discord card destacada.

### Punto 8 — Notificaciones

- [ ] Centro de notificaciones in-app.
- [ ] Vencimiento de regularidad.
- [ ] Eventos de sesiones.
- [ ] Eventos de denuncias.

### Punto 9 — Reportes y Estadísticas

- [ ] Usuarios activos.
- [ ] Materias cursadas/aprobadas por alumno.
- [ ] Materias cursadas/aprobadas por carrera.
- [ ] Materias con más materiales compartidos.
- [ ] Sesiones creadas por período.
- [ ] Materiales más valorados por materia.
- [ ] Estadísticas de denuncias/moderación.
- [ ] Conexiones por estudiante.
- [ ] Utilización de sesiones.
- [ ] Carreras con comunidad más activa.

---

## Plan por sprint actualizado

### Sprint 2 (07/05 → 21/05) — Completar deuda de puntos 1 a 4

Objetivo de demo: puntos 1 a 4 funcionando con tests básicos reales y con los faltantes de consigna cerrados sobre la base ya mergeada en PR #10.

Tareas principales:
- Tests reales de auth, CRUD académico, situación y asistente.
- Admin crea admins, lista cuentas y suspende/reactiva.
- Alinear carrera/plan con campos exactos de la consigna.
- Excel con preview, errores y corrección antes de confirmar.
- Actividades con créditos.
- Oferta académica, "qué pasa si" y planificador por horas.
- Actualizar Trello y README de demo end-to-end.

Detalle: `docs/sprint-2/ficha.md`.

### Sprint 3 (21/05 → 04/06) — Red social académica

Objetivo de demo: dos estudiantes editan perfil, se conectan por invitación y ven feed.

Tareas principales:
- Perfil, foto, privacidad y toggles.
- Servicio de email.
- Invitaciones, contactos y solicitudes.
- Feed de eventos académicos y posteos.
- Tests y documentación de demo.

Detalle: `docs/sprint-3/ficha.md`.

### Sprint 4 (04/06 → 25/06) — Sesiones + materiales base

Objetivo de demo: sesiones de estudio colaborativo funcionando y repositorio de materiales con valoración.

Tareas principales:
- Crear/listar/filtrar sesiones.
- Inscripción, aprobación, emails y recordatorio 24h.
- Storage de materiales, links, tags y búsqueda.
- Valoraciones y orden por valoración.

Detalle: `docs/sprint-4/ficha.md`.

### Sprint 5 (25/06 → 16/07) — Moderación, notificaciones, reportes y cierre

Objetivo de demo: app end-to-end estable, desplegada y lista para final.

Tareas principales:
- Denuncias y panel de moderación.
- Discord card destacada.
- Notificaciones in-app.
- Reportes admin.
- Hardening, tests/smoke, seed demo, deploy y documentación final.

Detalle: `docs/sprint-5/ficha.md`.

### Cierre (16/07 → 23/07)

- [ ] Bug bash de todo el equipo.
- [ ] Seed de datos de demo final.
- [ ] Deploy verificado.
- [ ] Slides de presentación final.
- [ ] Ensayo de demo.

---

## Convenciones técnicas

- Branching: `main` ← `dev` ← `feature/*` / `fix/*` / `docs/*`.
- Nunca PR directo a `main`.
- Commits: Conventional Commits en español (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- PRs contra `dev`, con plantilla, CODEOWNERS y CI verde.
- Backend: Node 20 + Express 5 + Mongoose.
- Frontend: React 19 + Vite + TypeScript.
- Variables de entorno: nunca commitear `.env`; mantener `.env.example` actualizado.

---

## Cómo agregar/cerrar trabajo

1. Leer este archivo, `docs/arquitectura.md` y la card de Trello asignada.
2. Crear branch desde `dev`: `git checkout dev && git pull && git checkout -b feature/nombre-descriptivo`.
3. Trabajar, testear, commitear y pushear.
4. Abrir PR contra `dev`.
5. Esperar CI verde y review aprobada.
6. Mergear.
7. Aplicar RULE 0.
