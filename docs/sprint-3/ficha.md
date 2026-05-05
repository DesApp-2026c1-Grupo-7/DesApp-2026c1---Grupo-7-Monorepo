# Sprint 3 — 21/05 → 04/06

**Objetivo:** completar el **punto 4 del TP** (algoritmos §3 y §4 del asistente, Excel import) y arrancar el **punto 5** con el perfil de estudiante.

> Alineado con `AGENTS.md` — sección Sprint 3. Este sprint llega al parcial con el asistente completo.

## Alcance
1. **Excel import** de situación académica (con preview + validación de errores antes de confirmar).
2. **Algoritmo §3** — "¿Qué pasa si...?": qué materias desbloquea regularizar el cuatri actual.
3. **Algoritmo §4** — Planificador de cursada según horas/semana, hasta recibirse, respetando correlatividades.
4. **Oferta académica por período** (admin carga las materias ofrecidas): modelo + CRUD + filtro en §1.
5. **Perfil de estudiante**: datos personales, foto, privacidad (público/privado), toggles de visibilidad.
6. **Tests de integración** (supertest contra API real) y pulido UX del asistente (feedback de sprint 2).

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Excel import con preview + errores | Thomas | `POST /api/situacion/import` + parser con `xlsx` (SheetJS) | `feature/excel-import` |
| Algoritmo §3 ("¿qué pasa si...?") endpoint + tests | Santino | `quePasaSi.service.js` + tests | `feature/asistente-que-pasa-si` |
| Algoritmo §4 (planificador) endpoint + tests | Santino | `planificador.service.js` + tests | `feature/asistente-planificador` |
| UI planificador (materias por cuatri, carga horaria) | Matías | `/frontend/src/pages/asistente/Planificador.tsx` | `feature/asistente-planificador-ui` |
| UI "¿qué pasa si?" | Matías | `/frontend/src/pages/asistente/QuePasaSi.tsx` | `feature/asistente-que-pasa-si-ui` |
| Oferta académica por período (modelo + CRUD admin) | Thomas | `oferta.model.js` + endpoints | `feature/oferta-academica` |
| Perfil de estudiante (modelo + endpoints + privacidad) | Santino | `perfil.controller.js` + middleware visibilidad | `feature/perfil-estudiante` |
| UI perfil (foto, datos, toggles de privacidad) | Matías | `/frontend/src/pages/perfil/*` | `feature/perfil-ui` |
| Tests de integración (supertest) + polish UX | Marcos | `/backend/tests/integration/*` | `feature/tests-integracion` |

## DoD
- [ ] Estudiante puede importar situación desde Excel, con preview de errores antes de confirmar.
- [ ] "¿Qué pasa si...?" muestra correctamente qué materias nuevas se desbloquean.
- [ ] Planificador genera un plan cuatrimestre a cuatrimestre hasta recibirse dado un límite de horas/semana.
- [ ] Admin puede gestionar la oferta académica del período y el filtro de inscribibles la respeta.
- [ ] Perfil de estudiante con privacidad funcional.
- [ ] Cobertura de tests backend > 60%.
- [ ] CI verde.

## Pre-medio término (11/06)
La cátedra evalúa parcialito el 11/06. Sprint 3 cierra el 04/06 — el equipo estudia con el asistente completo andando como referencia.

## Cronograma (14 días)
| Días | Foco |
|---|---|
| 1-3 | Excel import + algoritmo §3 con tests. |
| 4-7 | Algoritmo §4 (planificador) + oferta académica. |
| 8-10 | UI planificador + UI "¿qué pasa si?". |
| 11-12 | Perfil de estudiante (back + front). |
| 13 | Tests de integración + bugfix. |
| 14 | Demo + retro. |

## Riesgos
- Parser de Excel puede consumir tiempo: usar `xlsx` (SheetJS), no reinventar.
- Algoritmo del planificador tiene casos borde no triviales — destinar 2 días completos a esto.
- Frontend del planificador con drag & drop: usar `@dnd-kit/core`.

