# Cierre Sprint 1 — 16/04 → 07/05

## Alcance original (de la ficha)
1. Identificar actores y funcionalidades principales.
2. Realizar el DER.
3. Definir arquitectura inicial + entorno (estructura, repo, BD).
4. Navegación básica entre pantallas (Estudiante / Administrador).

## Lo que entregamos

| Tarea | Owner | Estado | Branch / PR |
|---|---|---|---|
| Setup CI + branching + plantillas + CONTRIBUTING + arquitectura | Thomas | ✅ Mergeado | PR #2 |
| Actores y funcionalidades + diagrama de casos de uso | Marcos | ✅ Mergeado | PR #3 |
| DER definitivo del sistema | Santino | ✅ Mergeado | PR #4 |
| Frontend skeleton + navegación + login/registro dummy | Matías | ✅ Mergeado | PR #1, #5, #6 |
| Backend skeleton + conexión a Mongo + `/api/health` | Thomas | ✅ Mergeado | PR backend-skeleton |
| DER borrador (insumo para Santino) | Thomas | ✅ Cerrado | rama eliminada |

## Lo que se sumó al alcance original (extras)
- `AGENTS.md` con plan completo del proyecto (sprints 2 a 5) y RULE 0 para agentes IA.
- Casos de uso detallados para los puntos 1 a 4 (`docs/sprint-1/casos-de-uso-detallados.md`).
- Diseño de algoritmos del asistente académico (`docs/sprint-1/algoritmos-asistente.md`).
- Fichas de los sprints 2, 3, 4 y 5.

## Lo que quedó fuera (consciente)
- **Mockups formales en Figma**: tenemos las pantallas dummy en el frontend, suficiente para sprint 2. Si la cátedra los pide, se hacen al inicio del sprint 2.
- **Estimación en story points**: no usamos. Estimamos por días/persona en cada ficha.
- **Tests automatizados**: planificados desde sprint 2.

## Riesgos detectados
1. **Santino se sumó tarde** al equipo — mitigado dándole el DER borrador como punto de partida.
2. **Mergeos directos a `main`** ocurrieron 2 veces (PR #3 y #6). Se sincronizó `main → dev`. Mitigación: configurar branch protection en GitHub (pendiente de Thomas).
3. **Punto 4 (asistente) es complejo** — mitigado pre-diseñando los algoritmos en el cierre del sprint 1.

## Métricas
- **6 PRs mergeados** durante el sprint.
- **5 tareas planificadas** (todas cerradas en Trello con DoD completo).
- **0 issues técnicos pendientes** que bloqueen el sprint 2.

## Demo del sprint 1 (para la review del 07/05)
1. Mostrar el repo en GitHub: branches `main`/`dev`, PRs con CODEOWNERS, CI corriendo verde.
2. Mostrar `docs/arquitectura.md` y `docs/sprint-1/DER.md`.
3. Mostrar `docs/sprint-1/actores-y-funcionalidades.md` con el diagrama de casos de uso.
4. Levantar el frontend (`npm run dev`) y navegar entre pantallas.
5. Levantar el backend y mostrar `GET /api/health` respondiendo 200.
6. Mostrar el board de Trello con todas las cards en "Hecho en este sprint".
7. Presentar la planificación de sprints 2 a 5 desde `AGENTS.md`.

## Retrospectiva (3 cosas)
- **Funcionó bien**: división clara de responsabilidades (uno por área), CI desde el día 1.
- **Mejorar**: respetar `dev` como rama de integración, no mergear directo a `main`.
- **Próximo sprint**: arrancar con tests desde el primer commit de cada feature.
