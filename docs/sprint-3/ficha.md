# Sprint 3 — 21/05 → 04/06

**Objetivo:** consolidar la gestión de finales y el historial académico completo.

## Alcance
1. **Finales**: registrar intentos, calcular vencimiento de regularidad (4 cuatris, parametrizable).
2. **Historial académico**: vista cronológica de todo lo cursado (timeline).
3. **Reportes para el estudiante**: PDF descargable con situación + avance.
4. **Refinamiento UX** del asistente (feedback de sprint 2).
5. **Tests de integración** (supertest contra API real).

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Modelo Final + cálculo vencimiento regularidad | Santino | `/backend/src/models/final.js` + `regularidad.service.js` | `feature/finales-modelo` |
| Endpoints finales (CRUD + listar pendientes) | Marcos | `finales.controller.js` + tests | `feature/finales-api` |
| UI finales (registrar intento + lista pendientes) | Matías | `/frontend/src/pages/finales/*` | `feature/finales-ui` |
| Historial académico (timeline) | Matías | `/frontend/src/pages/historial/*` | `feature/historial-ui` |
| Reportes PDF (puppeteer o pdfkit) | Thomas | `reportes.controller.js` + template | `feature/reportes-pdf` |
| Tests de integración (supertest) | Thomas | `/backend/tests/integration/*` | `feature/tests-integracion` |

## DoD
- [ ] Estudiante puede cargar el resultado de un final y ver historial de intentos.
- [ ] Sistema avisa cuando una regularidad está por vencer (< 1 cuatri).
- [ ] Reporte PDF descargable con situación completa.
- [ ] Suite de tests con cobertura > 60% en backend.
- [ ] CI verde.

## Cronograma (14 días)
| Días | Foco |
|---|---|
| 1-4 | Modelo Final + lógica de vencimiento. |
| 5-8 | UI finales + historial. |
| 9-11 | Reportes PDF. |
| 12-13 | Tests de integración + bugfix. |
| 14 | Demo + retro. |

## Pre-medio término (04/06 entrega)
La cátedra evalúa parcialito el 11/06. Sprint 3 cierra justo antes — todo el equipo estudia con la app andando como referencia.
