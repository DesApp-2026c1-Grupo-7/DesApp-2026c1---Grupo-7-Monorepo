# Sprint 2 — 07/05 → 21/05

**Objetivo:** llegar al **punto 4 del TP** con el núcleo funcional: auth real, CRUD académico, carga manual de situación y los algoritmos §1 (inscribibles) y §2 (% avance) del asistente.

> **Fuera de scope de este sprint** (se retoma en Sprint 3): Excel import, oferta académica, "¿qué pasa si...?" y planificador de cursada. Ver `AGENTS.md` — sección Sprint 2.

## Alcance
1. **Modelos + CRUD admin**: Carrera, PlanEstudio, Materia, Correlatividad.
2. **Auth real**: JWT, hash de password (bcrypt), middleware `requireAuth` + `requireRole`.
3. **Carga de situación académica manual** (UI + endpoint).
4. **Algoritmos del asistente §1 y §2**: inscribibles y % avance (con tests unitarios).
5. **Frontend asistente básico**: pantallas de inscribibles y % avance conectadas al backend.

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Modelos Mongoose + seed | Santino | `/backend/src/models/*.js` + script `seed.js` | `feature/modelos-academicos` |
| Auth real (JWT + bcrypt) + middlewares | Thomas | `/backend/src/middlewares/auth.js` + `auth.controller.js` real | `feature/auth-jwt` |
| CRUD admin (carreras/planes/materias/correlativas) backend | Marcos | endpoints + tests | `feature/admin-crud` |
| CRUD admin frontend (forms + tablas) | Matías | pantallas en `/frontend/src/pages/admin/*` | `feature/admin-ui` |
| Carga situación académica manual | Marcos + Matías | endpoint `POST /api/situacion` + UI de carga manual | `feature/situacion-academica` |
| Algoritmos §1 y §2 del asistente (servicios + tests) | Thomas | `/backend/src/services/asistente/inscribibles.js` + `avance.js` + tests | `feature/asistente-core` |
| UI asistente (inscribibles + % avance) | Matías | `/frontend/src/pages/asistente/Inscribibles.tsx` + `Avance.tsx` | `feature/asistente-ui` |

## DoD del sprint
- [ ] Tests unitarios pasando para los algoritmos §1 y §2 del asistente.
- [ ] Estudiante puede registrarse, loguearse, cargar situación manualmente, ver qué materias puede inscribir y su % de avance.
- [ ] Admin puede crear carrera/plan/materia/correlatividad por UI.
- [ ] CI verde en `dev`.
- [ ] Demo grabada o lista para mostrar.

## Riesgos
- Modelo de correlatividades puede tener edge cases (planes con múltiples condiciones): definir bien antes de implementar.
- Frontend del asistente requiere que el backend esté listo primero — coordinar con Thomas.

## Cronograma (14 días)
| Días | Foco |
|---|---|
| 1-3 | Modelos + auth + seed. Sin esto no se puede testear nada. |
| 4-7 | CRUD admin (back + front en paralelo). Carga de situación manual. |
| 8-11 | Algoritmos §1 y §2 con tests. UI asistente básico arranca. |
| 12-13 | Integración + bugfixes. |
| 14 | Demo, retro, PR final `dev`. |

