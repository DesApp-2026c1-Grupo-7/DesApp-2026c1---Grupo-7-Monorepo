# AGENTS.md - Plan de trabajo del Grupo 7

> Guia para agentes de IA y para el equipo humano.

## RULE 0 - Cerrar lo que se hace

Cada vez que un agente termine una tarea debe mover Trello, abrir/actualizar PR a `dev`, dejar CI verde, pedir review, actualizar este archivo si cambia el plan y hacer push. Si algo no se cerro del todo, crear una card nueva y documentarlo.

## Estado actual al 06/05/2026

La deuda de Sprint 1 sobre puntos 1 a 4 queda cerrada en `feature/cerrar-deuda-puntos-1-4`.
Además, se completó el rediseño responsive y la automatización de carreras en `feature/responsive-design`.

### Log de Actividades del Agente (06/05/2026)

- [x] **Rediseño Responsive:** Todo el sistema (Admin y Estudiante) es ahora adaptable a móviles y tablets. Se incluyó un nuevo Sidebar colapsable/horizontal y tablas con scroll.
- [x] **Automatización de Carreras:** El alta de carreras ahora autocompleta materias, créditos e inglés seleccionando un Plan de Estudio Base.
- [x] **Documentación Sprint 1:** Se consolidaron los objetivos cumplidos en `docs/sprint-1/objetivos-completados.md` y se cerró la ficha del Sprint 1.
- [x] **Fix de Entorno:** Se corrigió la URL de desarrollo del frontend (`--host`) en `package.json`.
- [x] **Pull Requests:** Creados PRs para `feature/responsive-design` y `docs/sprint-documentation` hacia `dev`.

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
- [x] Decision documentada: se usa `role` en lugar de discriminators explicitos.

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
- [x] Inscripcion a materias.
- [x] Registro de resultado de cuatrimestre.
- [x] Registro de presentaciones a finales.
- [x] Actividades con creditos.
- [x] Tests de situacion, importacion, inscripcion y finales.

### Punto 4 - Asistente Academico

- [x] Materias inscribibles respetando correlatividades.
- [x] Finales pendientes con intentos y vencimiento.
- [x] Creditos faltantes y materias UNAHUR faltantes.
- [x] Analisis por anio.
- [x] Porcentaje de avance.
- [x] Oferta academica y filtro de inscribibles.
- [x] Que-pasa-si.
- [x] Planificador por horas/semana con carga visible.
- [x] Tests de algoritmos.
- [x] Plus: comparar rendimiento real vs plan.
- [x] Plus: guardar varios planes.

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
- [ ] Inscripcion, aprobacion, emails, cancelar/editar y recordatorio 24h.

### Punto 7 - Repositorio de Materiales

- [ ] Subida de archivos permitidos hasta 25MB.
- [ ] Links externos, tags, listado, filtros.
- [ ] Valoracion y ordenamiento.
- [ ] Denuncias, moderacion y Discord destacado.

### Punto 8 - Notificaciones

- [ ] Centro de notificaciones in-app.
- [ ] Vencimiento de regularidad, sesiones y denuncias.

### Punto 9 - Reportes y Estadisticas

- [ ] Reportes de uso, academicos, materiales, sesiones, denuncias y sociales.

## Plan por sprint actualizado

### Sprint 2 (07/05 -> 21/05) - Red social academica

Objetivo: perfil, privacidad, contactos por invitacion y feed. Reunion docente prevista para jueves 07/05/2026.

### Sprint 3 (21/05 -> 04/06) - Sesiones de estudio

Objetivo: crear, listar, filtrar, inscribirse y gestionar sesiones.

### Sprint 4 (04/06 -> 25/06) - Materiales base + valoraciones

Objetivo: repositorio por materia con archivos/links, tags, busqueda y valoraciones.

### Sprint 5 (25/06 -> 16/07) - Moderacion, notificaciones, reportes y cierre

Objetivo: app end-to-end estable, deploy y documentacion final.
