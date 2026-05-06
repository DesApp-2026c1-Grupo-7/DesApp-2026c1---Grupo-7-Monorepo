# PR #10 — Cierre post-merge

## Estado

PR mergeado a `dev` el 06/05/2026.

Título final recomendado/mantenido:

`feat(sprint1): cierre funcional preliminar puntos 1-4`

Este archivo ya no es una descripción sugerida para un PR abierto. Queda como registro de cierre: el PR #10 dejó de tratarse como "Sprint 2" porque, al revisar la **Ficha principio de sprint 1**, el alcance original del Sprint 1 incluía una versión preliminar funcional hasta el **punto 4** del TP.

### Qué cubre de la ficha de Sprint 1

#### Punto 1 — Gestión de usuarios

- `User` con roles `student` / `admin`.
- Registro de estudiante y login con JWT.
- Seed de admin inicial.
- Guards frontend por rol y middlewares backend de auth/autorización.

Pendiente para Sprint 2: alta de otros admins, listado de cuentas, suspensión/reactivación, tests y decidir/documentar si se mantiene `role` en lugar de discriminators.

#### Punto 2 — Configuración académica

- CRUD de carreras, planes y materias.
- Relación carrera → planes.
- Materias por año/cuatrimestre/anual.
- Correlatividades.
- Créditos, materias UNAHUR, optativas y nivel de inglés.
- Pantallas admin de crear/editar/detalle.

Pendiente para Sprint 2: alinear campos exactos de la consigna (`titulo`, `instituto`, `duracionAnios`, estado de plan `Vigente/En transición/Discontinuado`) y tests.

#### Punto 3 — Situación académica

- Modelo `Grade` por estudiante/materia.
- Carga manual.
- Import Excel/CSV con feedback.
- Inscripción a cursada.
- Cierre de cuatrimestre.
- Modelo/endpoints de finales.

Pendiente para Sprint 2: preview real antes de confirmar Excel, corrección de filas antes de persistir, actividades con créditos y tests.

#### Punto 4 — Asistente académico

- Materias disponibles según correlatividades.
- Finales pendientes.
- Créditos faltantes y materias UNAHUR faltantes.
- Análisis por año.
- Porcentaje de avance.
- Proyección básica agrupada por año/cuatrimestre.
- UI conectada al backend.

Pendiente para Sprint 2: vencimiento de regularidad, oferta académica, "qué pasa si", planificador por horas/semana, movimiento manual de materias y tests de algoritmos.

### Documentación actualizada

- `AGENTS.md`: estado real y backlog re-marcado.
- `docs/sprint-1/cierre-sprint-1.md`: auditoría de lo hecho vs ficha original.
- `docs/sprint-1/trello-ajustes.md`: checklist sugerido para corregir Trello.
- `docs/sprint-2/ficha.md` a `docs/sprint-5/ficha.md`: sprints replanificados según lo realmente hecho.
- `README.md` y `docs/arquitectura.md`: alcance de sprints y nota de replanificación.

### Plan de prueba sugerido

1. Levantar backend (`cd backend && npm install && npm run dev`).
2. Levantar frontend (`cd frontend && npm install && npm run dev`).
3. Login admin: `admin@universidad.edu` / `admin123`.
4. Crear/editar carrera, materia con correlativas y plan.
5. Login estudiante: `estudiante@universidad.edu` / `estudiante123`.
6. Cargar situación manual o importar CSV/Excel.
7. Ver asistente: disponibles, avance, análisis por año y finales pendientes.
8. Verificar que endpoints protegidos rechazan requests sin token.

### Nota de cierre post-merge

El PR #10 ya puede contarse como mergeado y con review comments corregidos. No alcanza para dar por completo todo el punto 1 a 4 de la consigna: los tests reales y los faltantes funcionales quedan planificados en Sprint 2.
