# Sprint 2 — 07/05 → 21/05

**Objetivo:** completar la deuda de los puntos 1 a 4 sobre la base ya mergeada en el PR #10, convertir la demo preliminar en funcionalidad confiable y dejar la base académica lista para empezar social/sesiones.

> Replanificado el 06/05/2026 después de revisar la ficha original de Sprint 1 y el PR #10. El trabajo de auth, CRUD académico, situación académica, Excel y asistente básico ya no se cuenta como "futuro": se considera avance de Sprint 1 ya mergeado. Sprint 2 toma la deuda explícita que quedó para completar puntos 1 a 4.

## Alcance

1. **Tests básicos reales**: auth, CRUD académico, situación académica y asistente.
2. **Usuarios admin**: alta de administradores, listado de cuentas, suspensión/reactivación.
3. **Alinear modelos con la consigna**: carrera con título, instituto y duración; plan con estado `Vigente / En transición / Discontinuado`.
4. **Excel con preview**: validar archivo, mostrar errores, permitir corrección antes de confirmar.
5. **Actividades con créditos**: carga y cómputo dentro del avance.
6. **Asistente faltante de punto 4**:
   - Vencimiento de regularidad.
   - Oferta académica por período y filtro de inscribibles.
   - "¿Qué pasa si...?"
   - Planificador por horas/semana.
7. **Documentación/Trello**: board, README y checklist de demo alineados al estado post-merge.

## Distribución

| Tarea | Owner | Entregable | Branch sugerida |
|---|---|---|---|
| Tests backend de auth + CRUD académico | Marcos | Tests con runner real, no placeholder | `test/auth-crud-academico` |
| Gestión admin de usuarios | Thomas | Endpoints + UI mínima para admins/cuentas/suspensión | `feature/admin-usuarios` |
| Ajuste modelos carrera/plan según consigna | Santino | Campos y migración/seed actualizados | `feature/modelos-consigna` |
| Excel preview + corrección antes de confirmar | Thomas | Endpoint preview + UI de corrección + confirmación | `feature/excel-preview` |
| Actividades con créditos | Santino | Modelo/endpoints + impacto en avance | `feature/actividades-creditos` |
| Oferta académica + filtro de inscribibles | Santino | Modelo, CRUD admin y filtro del asistente | `feature/oferta-academica` |
| "¿Qué pasa si...?" + planificador por horas | Thomas | Endpoints + tests de algoritmos | `feature/asistente-proyecciones` |
| UI planificador y qué-pasa-si | Matías | Pantallas conectadas, carga horaria visible | `feature/asistente-proyecciones-ui` |
| Documentación/Trello post PR #10 | Marcos | README, checklist de demo y Trello alineados | `docs/demo-sprint2` |

## Definition of Done

- [x] PR #10 mergeado a `dev`.
- [x] CI verde en PR #10.
- [ ] Hay tests reales ejecutándose en backend.
- [ ] Admin puede crear admins, listar cuentas y suspender/reactivar usuarios.
- [ ] Admin puede configurar carreras/planes/materias con campos de la consigna.
- [ ] Estudiante puede importar Excel con preview, corrección y confirmación.
- [ ] El asistente cubre análisis actual y proyecciones principales del punto 4.
- [ ] README explica cómo correr la demo end-to-end.
- [ ] Trello refleja qué se cerró y qué quedó como pendiente explícito.

## Riesgos

- El planificador puede crecer mucho; para Sprint 2 alcanza con una primera versión determinística y testeada.
- Excel preview requiere separar validación de persistencia; no conviene seguir procesando directo.
- La deuda de tests es crítica: priorizar happy paths reales antes de sumar features sociales.

## Cronograma

| Días | Foco |
|---|---|
| 1-3 | Tests reales + gestión admin de usuarios. |
| 4-6 | Ajuste modelos consigna + Excel preview. |
| 7-10 | Oferta académica, qué-pasa-si y planificador. |
| 11-12 | UI, integración y bugfixes. |
| 13 | Demo end-to-end, Trello y documentación. |
| 14 | Buffer de review/CI y retro. |
