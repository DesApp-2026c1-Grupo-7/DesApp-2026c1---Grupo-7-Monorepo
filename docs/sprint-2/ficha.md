# Sprint 2 — 07/05 → 21/05

**Objetivo:** cerrar bien los puntos 1 a 4 que quedaron adelantados en el PR #10, convertir la demo preliminar en funcionalidad confiable y dejar la base académica lista para empezar social/sesiones.

> Replanificado el 06/05/2026 después de revisar la ficha original de Sprint 1 y el PR #10. El trabajo de auth, CRUD académico, situación académica, Excel y asistente básico ya no se cuenta como "futuro": se considera avance de Sprint 1 pendiente de cerrar.

## Alcance

1. **Cerrar PR #10**: resolver comentarios de review, CI verde, aprobación y merge a `dev`.
2. **Tests básicos reales**: auth, CRUD académico, situación académica y asistente.
3. **Usuarios admin**: alta de administradores, listado de cuentas, suspensión/reactivación.
4. **Alinear modelos con la consigna**: carrera con título, instituto y duración; plan con estado `Vigente / En transición / Discontinuado`.
5. **Excel con preview**: validar archivo, mostrar errores, permitir corrección antes de confirmar.
6. **Actividades con créditos**: carga y cómputo dentro del avance.
7. **Asistente faltante de punto 4**:
   - Vencimiento de regularidad.
   - Oferta académica por período y filtro de inscribibles.
   - "¿Qué pasa si...?"
   - Planificador por horas/semana.

## Distribución

| Tarea | Owner | Entregable | Branch sugerida |
|---|---|---|---|
| Resolver review PR #10 + merge a `dev` | Thomas | PR #10 actualizado, aprobado y mergeado | `feature/sprint2-completo` |
| Tests backend de auth + CRUD académico | Marcos | Tests con runner real, no placeholder | `test/auth-crud-academico` |
| Gestión admin de usuarios | Thomas | Endpoints + UI mínima para admins/cuentas/suspensión | `feature/admin-usuarios` |
| Ajuste modelos carrera/plan según consigna | Santino | Campos y migración/seed actualizados | `feature/modelos-consigna` |
| Excel preview + corrección antes de confirmar | Thomas | Endpoint preview + UI de corrección + confirmación | `feature/excel-preview` |
| Actividades con créditos | Santino | Modelo/endpoints + impacto en avance | `feature/actividades-creditos` |
| Oferta académica + filtro de inscribibles | Santino | Modelo, CRUD admin y filtro del asistente | `feature/oferta-academica` |
| "¿Qué pasa si...?" + planificador por horas | Thomas | Endpoints + tests de algoritmos | `feature/asistente-proyecciones` |
| UI planificador y qué-pasa-si | Matías | Pantallas conectadas, carga horaria visible | `feature/asistente-proyecciones-ui` |
| Documentación demo end-to-end | Marcos | README y checklist de demo actualizados | `docs/demo-sprint2` |

## Definition of Done

- [ ] PR #10 mergeado a `dev`.
- [ ] CI verde.
- [ ] Hay tests reales ejecutándose en backend.
- [ ] Admin puede crear admins, listar cuentas y suspender/reactivar usuarios.
- [ ] Admin puede configurar carreras/planes/materias con campos de la consigna.
- [ ] Estudiante puede importar Excel con preview, corrección y confirmación.
- [ ] El asistente cubre análisis actual y proyecciones principales del punto 4.
- [ ] README explica cómo correr la demo end-to-end.
- [ ] Trello refleja qué se cerró y qué quedó como pendiente explícito.

## Riesgos

- El PR #10 es grande y tiene comentarios de review: resolverlos antes de sumar más cambios evita arrastrar bugs.
- El planificador puede crecer mucho; para Sprint 2 alcanza con una primera versión determinística y testeada.
- Excel preview requiere separar validación de persistencia; no conviene seguir procesando directo.

## Cronograma

| Días | Foco |
|---|---|
| 1-2 | Resolver review PR #10, CI y merge. |
| 3-5 | Tests reales + gestión admin de usuarios. |
| 6-8 | Ajuste modelos consigna + Excel preview. |
| 9-11 | Oferta académica, qué-pasa-si y planificador. |
| 12-13 | UI, integración y bugfixes. |
| 14 | Demo, Trello, retro y documentación. |
