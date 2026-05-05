# Sprint 2 — 07/05 → 21/05

**Objetivo:** llegar al **punto 4 del TP** (asistente académico funcional end-to-end).

## Alcance
1. **Modelos + CRUD admin**: Carrera, PlanEstudio, Materia, Correlatividad, Oferta.
2. **Auth real**: JWT, hash de password (bcrypt), middleware `requireAuth` + `requireRole`.
3. **Carga de situación académica** (manual + Excel con preview).
4. **Algoritmos del asistente** (§ 1 a § 4 de `algoritmos-asistente.md`).
5. **Frontend asistente**: pantallas de inscribibles, % avance, "qué pasa si", planificador.

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Modelos Mongoose + seed | Santino | `/backend/src/models/*.js` + script `seed.js` | `feature/modelos-academicos` |
| Auth real (JWT + bcrypt) + middlewares | Thomas | `/backend/src/middlewares/auth.js` + `auth.controller.js` real | `feature/auth-jwt` |
| CRUD admin (carreras/planes/materias/correlativas) backend | Marcos | endpoints + tests | `feature/admin-crud` |
| CRUD admin frontend (forms + tablas) | Matías | pantallas en `/frontend/src/pages/admin/*` | `feature/admin-ui` |
| Carga situación académica (manual + Excel) | Marcos + Matías | endpoint `POST /api/situacion/import` + UI con preview | `feature/situacion-academica` |
| Algoritmos del asistente (4 servicios + tests) | Thomas | `/backend/src/services/asistente/*.js` + tests | `feature/asistente-core` |
| UI asistente (4 pantallas) | Matías | `/frontend/src/pages/asistente/*` | `feature/asistente-ui` |

## DoD del sprint
- [ ] Test unitarios pasando para los 4 algoritmos del asistente.
- [ ] Estudiante puede registrarse, loguearse, cargar situación, ver inscribibles, ver % avance, simular "qué pasa si", generar plan de cursada.
- [ ] Admin puede crear carrera/plan/materia/correlatividad por UI.
- [ ] CI verde en `dev`.
- [ ] Demo grabada o lista para mostrar.

## Riesgos
- Parser de Excel puede consumir tiempo: usar `xlsx` (SheetJS), no reinventar.
- Algoritmo del planificador tiene casos borde no triviales — destinar 2 días enteros de Thomas a esto.
- Frontend del asistente requiere drag & drop: usar `@dnd-kit/core` (probado, ligero).

## Cronograma (14 días)
| Días | Foco |
|---|---|
| 1-3 | Modelos + auth + seed. Sin esto no se puede testear nada. |
| 4-7 | CRUD admin (back + front en paralelo). Carga de situación. |
| 8-11 | Algoritmos del asistente con tests. UI asistente arranca. |
| 12-13 | Integración + bugfixes. |
| 14 | Demo, retro, PR final `dev → main`. |
