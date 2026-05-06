# Sprint 5 — 25/06 → 16/07

**Objetivo:** cerrar materiales avanzados, notificaciones, reportes, hardening, deploy y documentación final.

## Alcance

1. **Materiales avanzados**:
   - Denuncias con motivos configurables y opción "otro".
   - Mostrar denuncias pendientes/verificadas.
   - Suspensión automática por N pendientes o M verificadas.
   - Material suspendido: metadatos visibles, contenido bloqueado.
   - Panel de moderación admin.
   - Notificación al autor y denunciante.
   - Discord card destacada.
2. **Notificaciones in-app**:
   - Centro de notificaciones.
   - Vencimiento de regularidad.
   - Eventos de sesiones.
   - Eventos de denuncias/moderación.
3. **Reportes y estadísticas admin**:
   - Uso del sistema.
   - Materias cursadas/aprobadas por alumno y carrera.
   - Materiales y sesiones.
   - Denuncias/moderación.
   - Métricas sociales.
4. **Cierre técnico**:
   - Hardening de permisos, validaciones y errores.
   - Tests E2E/smoke de flujos críticos.
   - Seed de demo final.
   - Deploy.
   - Manual de usuario y documentación final.

## Distribución

| Tarea | Owner | Entregable | Branch sugerida |
|---|---|---|---|
| Denuncias + motivos configurables | Thomas | Modelos/endpoints + reglas de suspensión | `feature/materiales-denuncias` |
| Panel moderación admin | Santino | Endpoints admin + estados denuncia | `feature/moderacion-admin` |
| UI denuncias + moderación | Matías | Denunciar, ver estado, moderar | `feature/moderacion-ui` |
| Discord card destacada | Matías | Componente visual y detección de link Discord | `feature/discord-card` |
| Notificaciones in-app | Santino | Modelo/endpoints + campanita UI | `feature/notificaciones-inapp` |
| Endpoints reportes | Thomas | Agregaciones Mongo para métricas | `feature/reportes-api` |
| UI reportes admin | Matías | Tablas/gráficos básicos | `feature/reportes-ui` |
| Hardening validaciones/permisos | Thomas | Validación, autorización y manejo de errores | `feature/hardening` |
| QA integral + E2E/smoke | Marcos | Flujos críticos documentados y testeados | `test/e2e-smoke` |
| Deploy + seed demo + docs finales | Marcos + Thomas | URL, README final y manuales | `chore/deploy-docs-finales` |

## Definition of Done del sprint y del proyecto

- [ ] Denuncias y moderación funcionan end-to-end.
- [ ] Suspensión automática de materiales probada.
- [ ] Discord card se ve destacada.
- [ ] Centro de notificaciones muestra al menos 3 disparadores.
- [ ] Dashboard admin cubre uso, académico, materiales, sesiones y social.
- [ ] Hay seed de demo final reproducible.
- [ ] App desplegada y documentada.
- [ ] Tests/smoke principales pasan.
- [ ] README final, manual de usuario y manual técnico actualizados.
- [ ] Trello está alineado con el estado final.

## Riesgos

- Reportes pueden consumir tiempo si se busca demasiada precisión; priorizar métricas demostrables.
- No dejar deploy para el último día.
- La última semana debe ser bugfix, datos demo y documentación, no features nuevas.

## Cronograma

| Días | Foco |
|---|---|
| 1-4 | Denuncias, moderación y Discord card. |
| 5-7 | Notificaciones in-app. |
| 8-11 | Reportes API + dashboard admin. |
| 12-14 | Hardening + tests/smoke. |
| 15-17 | Deploy + seed demo. |
| 18-20 | Documentación final, manuales y bug bash. |
| 21 | Review final del sprint. |
