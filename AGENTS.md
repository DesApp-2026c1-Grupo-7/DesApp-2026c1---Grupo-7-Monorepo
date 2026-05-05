# AGENTS.md — Plan de trabajo del Grupo 7

> **Para quién es este archivo:** cualquier agente de IA que asista a un integrante del equipo (Claude Code, Cursor, Gemini, Copilot, etc.). También sirve como brújula para los humanos.

---

## RULE 0 — Cerrar lo que se hace (regla obligatoria para agentes)

Cada vez que un agente termine una tarea, **antes de devolver el control al usuario debe**:

1. **Marcar la card de Trello como hecha**: mover a la lista `Hecho en este sprint` y marcar todos los ítems del checklist "Definition of Done" como `complete`. Board: https://trello.com/b/aUEcBwaC/desapp-2026c1-grupo-7
2. **Mergear el PR a `dev`** (no a `main`) o, si la persona no tiene permisos, dejar el PR abierto con CI verde y avisar.
3. **Actualizar este archivo** si la tarea cambió el plan: tachar lo cerrado en el backlog, anotar lo que quedó pendiente.
4. **Hacer push** del trabajo al remoto antes de cerrar la sesión.

Si una tarea no se cerró del todo, marcar **explícitamente** qué quedó pendiente y crear una card nueva — nunca dejar trabajo "fantasma".

---

## Cronograma del cuatrimestre (cátedra)

| Fecha | Hito |
|---|---|
| 07/05 | **Sprint 1 review + Sprint 2 planning** |
| 21/05 | **Sprint 2 review + Sprint 3 planning** |
| 04/06 | **Sprint 3 review + Sprint 4 planning** |
| 11/06 | 🎯 **Presentación medio término** |
| 25/06 | **Sprint 4 review + Sprint 5 planning** |
| 16/07 | **Sprint 5 review** |
| 23/07 | 🎯 **Presentación final** |

5 sprints de ~2 semanas. El plan asume ~10h/persona/sprint = 40h/equipo/sprint = ~200h totales.

---

## Equipo y responsabilidades por defecto

| Integrante | GitHub | Foco principal | Backup |
|---|---|---|---|
| **Thomas Casco** | @ThomasCasco | Backend + coordinación + DevOps | Frontend |
| **Santino Galdín** | @SantinoGaldin1 | Backend + modelado de datos | Backend |
| **Matías López** | @Matias1345 | Frontend (React) | Frontend |
| **Marcos Bejarano** | @Marcos0129 | Análisis + UX + frontend liviano | Docs |

Reglas de asignación:
- Cada card de Trello tiene **un dueño único**.
- Si alguien queda sin tarea, toma la siguiente del backlog priorizado.
- Bloqueos se avisan en el grupo el mismo día.

---

## Estado actual (al cierre de Sprint 1, 2026-05-05)

✅ Setup técnico (CI, branching, CONTRIBUTING, README, arquitectura)
✅ Actores y funcionalidades (Marcos)
✅ DER definitivo (Santino)
✅ Frontend skeleton con navegación + login/registro dummy (Matías)
✅ Backend skeleton con `/api/health` y conexión Mongo (Thomas)

**Estado del código:** sin lógica de negocio. Todo lo que sigue es construir la app.

---

## Backlog completo (los 9 puntos del TP)

### Punto 1 — Gestión de Usuarios
- [ ] Modelo `User` + discriminators `Estudiante` / `Administrador`
- [ ] Registro de estudiante (autoinscripción)
- [ ] Login con JWT (estudiante y admin)
- [ ] Seed del admin inicial al arrancar la app
- [ ] Admin da de alta otros admins
- [ ] Admin lista todas las cuentas
- [ ] Admin suspende/reactiva cuentas

### Punto 2 — Configuración Académica (admin)
**2.1 Carreras y Planes**
- [ ] CRUD Carreras (nombre, título, instituto, duración en años)
- [ ] CRUD Planes de estudio (nombre, estado: Vigente/En transición/Discontinuado)
- [ ] Una carrera puede tener varios planes

**2.2 Plan de Estudios**
- [ ] Carga de materias en un plan (año, anual/cuatrimestral)
- [ ] Condiciones especiales: materias UNaHur, niveles de inglés, créditos
- [ ] Materias optativas para créditos
- [ ] Definición de **correlatividades** (materias requisito)

### Punto 3 — Gestión de Situación Académica (estudiante)
- [ ] Modelo `SituacionMateria` por estudiante (aprobada / regularizada / cursando, año, cuatrimestre)
- [ ] Carga inicial **manual** desde la UI
- [ ] Carga inicial **desde Excel** con preview + corrección antes de confirmar
- [ ] Validación y errores visibles en el preview del Excel
- [ ] Inscripción a materias de cada cuatrimestre (al inicio)
- [ ] Registro de resultado de cuatrimestre (al final)
- [ ] Registro de presentaciones a finales (intentos)
- [ ] Carga de actividades con créditos

### Punto 4 — Asistente Académico
**4.1 Análisis de situación actual**
- [ ] Materias en las que puede inscribirse (respetando correlatividades)
- [ ] Finales pendientes con intentos previos y vencimiento de regularidad
- [ ] Otras condiciones para recibirse: créditos faltantes, materias UNaHur faltantes
- [ ] Análisis por año de cursada (aprobadas / regularizadas / faltantes por año)
- [ ] Porcentaje de avance en la carrera
- [ ] **Plus**: filtro por oferta académica del período (admin carga la oferta)

**4.2 Proyecciones**
- [ ] "¿Qué pasa si...?" — qué desbloquea regularizar materias del cuatri actual
- [ ] Planificador de cursada según horas/semana, hasta recibirse, respetando correlatividades
- [ ] El estudiante puede mover materias en el planificador y ver carga horaria
- [ ] **Plus**: comparar rendimiento real vs plan
- [ ] **Plus**: guardar varios planes

### Punto 5 — Red Social Académica
**5.1 Perfil**
- [ ] Datos personales + carrera/s + situación académica + foto
- [ ] Privacidad: público / privado
- [ ] Toggles: mostrar email, mostrar situación académica, publicar eventos

**5.2 Conexiones**
- [ ] Invitación por email (mail desde la app)
- [ ] Aceptar/rechazar via link (con login previo si hace falta)
- [ ] Si el destinatario no está registrado, avisar al invitador
- [ ] Pantalla "mis contactos" + solicitudes pendientes

**5.3 Feed**
- [ ] Eventos académicos de contactos (inscripción, regularización, aprobación)
- [ ] Posteos manuales de estudiantes
- [ ] Toggle por estudiante de qué eventos publicar

### Punto 6 — Sesiones de Estudio Colaborativo
- [ ] Crear sesión: materia, tema, tipo (virtual/presencial), fecha, duración, cupos, descripción, requiere aprobación
- [ ] Visibilidad según perfil del creador (público = todos, privado = sólo contactos)
- [ ] Filtros de búsqueda
- [ ] Inscripción de estudiantes
- [ ] Aprobación manual del creador (si corresponde)
- [ ] Email de confirmación al inscripto
- [ ] Editar / cancelar sesión (con notificación a inscriptos)
- [ ] Recordatorio automático 24h antes (job)

### Punto 7 — Repositorio de Materiales por Materia
**7.1 Publicación**
- [ ] Subida de archivos (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, ZIP — máx 25MB)
- [ ] Carga de links externos (YouTube, Drive, Dropbox, web, Discord, GitHub)
- [ ] Tags / metadata para búsqueda
- [ ] Listado y filtros para consulta

**7.2 Valoración**
- [ ] 👍 / 👎 por estudiante
- [ ] Totales y ratio en listado
- [ ] Ordenar por valoración

**7.3 Denuncias**
- [ ] Motivos configurables por admin + opción "otro" con texto libre
- [ ] Mostrar en listado si hay denuncias pendientes/verificadas
- [ ] Suspensión automática si supera N pendientes o M verificadas (N y M configurables por admin)
- [ ] Material suspendido: se ven metadatos pero no el contenido

**7.4 Panel de moderación (admin)**
- [ ] Listado de denuncias con filtros
- [ ] Acceso al material denunciado/suspendido
- [ ] Confirmar / rechazar denuncia
- [ ] Notificar al autor del material y al denunciante

**7.5 Discord destacado**
- [ ] Visualización especial: ícono Discord, nombre del servidor, descripción del canal, estilos Discord, botón "Unirse"

### Punto 8 — Notificaciones in-app
- [ ] Centro de notificaciones dentro de la app (mismo contenido que el email)
- [ ] Disparadores: vencimiento de regularidad, eventos de sesiones, eventos de denuncias

### Punto 9 — Reportes y Estadísticas (admin)
**Uso del sistema**
- [ ] Usuarios activos
- [ ] Distribución de materias cursadas/aprobadas por alumno
- [ ] Materias cursadas/aprobadas por carrera
- [ ] Materias con más materiales compartidos
- [ ] Sesiones creadas por período
- [ ] Materiales más valorados por materia
- [ ] Estadísticas de denuncias y moderación

**Sociales**
- [ ] Conexiones por estudiante
- [ ] Utilización de sesiones
- [ ] Carreras con comunidad más activa

---

## Plan por sprint

### 🚀 Sprint 2 (07/05 → 21/05) — Núcleo académico hasta el asistente

**Objetivo de demo:** un admin crea una carrera con un plan y materias con correlatividades, un estudiante se registra, carga su situación académica manual, y el asistente le muestra a qué materias se puede inscribir + % avance.

**Asignación tentativa:**

| Tarea | Owner | Backup |
|---|---|---|
| Auth: modelo User+discriminators, registro estudiante, login, seed admin inicial | **Thomas** | Santino |
| CRUD Carreras + Planes (back + endpoints) | **Santino** | Thomas |
| CRUD Materias en plan + correlatividades (back) | **Santino** | Thomas |
| Pantallas admin: gestión de carreras / planes / materias / correlatividades | **Matías** | Marcos |
| Pantalla estudiante: carga de situación académica manual | **Matías** | Marcos |
| Endpoints situación académica (CRUD `SituacionMateria`) | **Thomas** | Santino |
| Asistente — endpoints: inscribibles, finales pendientes, % avance, análisis por año | **Thomas** | Santino |
| Pantalla asistente: dashboard con análisis de situación actual | **Matías** | Marcos |
| Documentación de endpoints (Postman / OpenAPI rápido) y casos de uso del sprint | **Marcos** | Thomas |

**Fuera de scope del sprint 2** (queda para 3): Excel import, "qué pasa si", planificador, oferta académica.

**Definition of Done del sprint:**
- Todos los endpoints con tests de humo (al menos 1 happy path)
- Frontend conectado al backend, no mocks
- README actualizado con cómo correr la demo end-to-end

---

### 🚀 Sprint 3 (21/05 → 04/06) — Cierre del asistente + arranque social

**Objetivo de demo:** asistente completo (con planificador y "qué pasa si"), import de Excel para situación académica, perfiles de estudiante con privacidad.

| Tarea | Owner | Backup |
|---|---|---|
| Excel import de situación académica con preview + errores | **Thomas** | Santino |
| Endpoints + lógica "¿Qué pasa si...?" | **Santino** | Thomas |
| Endpoint planificador de cursada por horas/semana | **Santino** | Thomas |
| UI planificador (drag de materias, carga horaria por cuatri) | **Matías** | Thomas |
| Oferta académica por período (admin) — modelo + CRUD | **Thomas** | Santino |
| Filtro de inscribibles por oferta académica | **Thomas** | Santino |
| Perfil de estudiante: datos, foto, privacidad | **Matías** | Marcos |
| Endpoints perfil con visibilidad pública/privada | **Santino** | Thomas |
| Validación, manejo de errores y polish para presentación medio término | **Marcos** | Todos |

---

### 🚀 Sprint 4 (04/06 → 25/06) — Red social + sesiones (post-presentación medio término 11/06)

**Objetivo de demo:** dos estudiantes se conectan, ven feed con eventos, y crean/se inscriben a una sesión de estudio con email de confirmación.

| Tarea | Owner | Backup |
|---|---|---|
| Sistema de invitaciones por email + aceptar/rechazar | **Thomas** | Santino |
| Modelo + endpoints de contactos | **Santino** | Thomas |
| UI de contactos + solicitudes pendientes | **Matías** | Marcos |
| Modelo + endpoints `EventoFeed` (inscripciones, regularizaciones, aprobaciones, posteos) | **Santino** | Thomas |
| UI feed de novedades + posteos | **Matías** | Marcos |
| Sesiones de estudio: modelo + CRUD + visibilidad por privacidad del creador | **Thomas** | Santino |
| Inscripción a sesión + aprobación manual + email de confirmación | **Thomas** | Santino |
| UI sesiones: crear, listar con filtros, inscribirse, gestionar | **Matías** | Marcos |
| Job de recordatorio 24h antes (cron) | **Thomas** | Santino |
| Configurar servicio de mail (SMTP / SendGrid / Mailgun — definir) | **Thomas** | Santino |
| Casos de prueba de los flujos sociales y de sesiones | **Marcos** | Todos |

---

### 🚀 Sprint 5 (25/06 → 16/07) — Materiales + notificaciones + reportes

**Objetivo de demo:** la app entera funcionando end-to-end con materiales, denuncias moderadas, notificaciones y reportes.

| Tarea | Owner | Backup |
|---|---|---|
| Storage de archivos (definir: filesystem local, S3, Cloudinary) y subida con límite 25MB | **Thomas** | Santino |
| Validación de formatos permitidos | **Thomas** | Santino |
| CRUD materiales (archivos + links) con tags/metadata + búsqueda | **Santino** | Thomas |
| Sistema de valoración 👍/👎 + ratio + sort | **Santino** | Thomas |
| Sistema de denuncias + motivos configurables por admin | **Thomas** | Santino |
| Suspensión automática (N/M configurables) | **Thomas** | Santino |
| Panel de moderación (admin) | **Santino** | Thomas |
| UI repositorio de materiales por materia + filtros + ordenamiento | **Matías** | Marcos |
| UI denuncias (estudiante) + UI moderación (admin) | **Matías** | Marcos |
| **Discord card destacada** (icono, estilos, botón Unirse) | **Matías** | Marcos |
| Centro de notificaciones in-app (modelo + endpoints + UI campanita) | **Santino** | Matías |
| Endpoints de reportes (uso del sistema + sociales) | **Thomas** | Santino |
| UI reportes admin con tablas/gráficos básicos | **Matías** | Marcos |
| Documentación final + manual de usuario + README de la presentación | **Marcos** | Todos |

---

### 🏁 Cierre (16/07 → 23/07) — Pulido y presentación final

- [ ] Bug bash de todo el equipo
- [ ] Seed de datos de demo (1 admin, 2-3 estudiantes con relaciones, 1 carrera con plan completo)
- [ ] Deploy a algún servicio (definir: Render, Railway, Fly, etc.)
- [ ] Slides de la presentación final
- [ ] Ensayo de la demo

---

## Convenciones técnicas

Todo lo que sigue está documentado en detalle en `CONTRIBUTING.md`, `docs/arquitectura.md` y `README.md`. Resumen para agentes:

- **Branching**: `main` ← `dev` ← `feature/*` / `fix/*` / `docs/*`. Nunca PR directo a `main`.
- **Commits**: Conventional Commits en español (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- **PRs**: contra `dev`, con plantilla, CODEOWNERS aprueba, CI tiene que estar verde.
- **Backend**: Node 20 + Express 5 + Mongoose. Estructura `src/{config,controllers,services,models,routes,middlewares,utils}`.
- **Frontend**: React 19 + Vite + TypeScript. Estructura `src/{pages,components,hooks,services,layouts,styles}`.
- **Variables de entorno**: nunca commitear `.env`. Mantener `.env.example` actualizado.

---

## Cómo agregar/cerrar trabajo (recordatorio para agentes)

1. Antes de empezar: leer este archivo, leer `docs/arquitectura.md`, mirar la card de Trello asignada.
2. Crear branch desde `dev`: `git checkout dev && git pull && git checkout -b feature/nombre-descriptivo`.
3. Trabajar, commitear, pushear.
4. PR contra `dev`, esperar CI, mergear.
5. **Aplicar RULE 0** (mover card, marcar checklist, actualizar este archivo, push).
