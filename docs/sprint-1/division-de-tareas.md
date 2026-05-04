# División de tareas - Sprint 1

**Sprint:** 16-04-2026 → 07-05-2026
**Días que quedan al armar este plan:** 4 (03-05 a 07-05)

## Alcance del sprint (puntos 1-4 de la ficha)

1. Identificar actores y funcionalidades principales.
2. Realizar el DER.
3. Definir arquitectura inicial + entorno (estructura, repo, BD).
4. Navegación básica entre pantallas (Estudiante / Administrador).

## Distribución propuesta

| # | Tarea                                                               | Responsable        | Entregable                                       | Branch sugerida                          |
|---|---------------------------------------------------------------------|--------------------|--------------------------------------------------|------------------------------------------|
| 1 | Actores y funcionalidades principales (completar y revisar doc)     | Marcos Bejarano (@Marcos0129)    | `docs/sprint-1/actores-y-funcionalidades.md`    | `docs/actores-funcionalidades`           |
| 2 | DER (validar entidades, dibujar diagrama, exportar imagen)          | Santino Galdín (@SantinoGaldin1) | `docs/sprint-1/DER.md` + imagen                 | `docs/der`                               |
| 3 | Arquitectura, conexión a Mongo, estructura de carpetas backend      | Thomas Casco (@ThomasCasco)      | `docs/arquitectura.md` + scaffolding `/backend`  | `feature/backend-skeleton`               |
| 4 | Navegación básica frontend (router + pantallas vacías estud/admin)  | Matías López (@Matias1345)       | `/frontend` con react-router y pantallas dummy   | `feature/frontend-navegacion`            |
| 5 | CI/CD, branch protection, plantillas de PR (ya hecho)               | Thomas Casco (@ThomasCasco)      | `.github/`, `CONTRIBUTING.md`, `README.md`       | `chore/setup-ci-y-flujo` ✅              |

## Cronograma sugerido (4 días)

| Día        | Foco                                                         |
|------------|--------------------------------------------------------------|
| Día 1 (03-05 sábado) | Cada uno crea su rama, levanta el repo localmente, lee `CONTRIBUTING.md`. Tareas 1 y 2 arrancan. |
| Día 2 (04-05)        | Tareas 1, 2, 3 avanzan en paralelo. Primer PR a `dev` (el que esté listo).                       |
| Día 3 (05-05)        | Tarea 4 (frontend) integra con la estructura de tarea 3. Reviews cruzadas.                       |
| Día 4 (06-05)        | Cierre, último round de reviews, todo merge a `dev`.                                              |
| Día 5 (07-05)        | PR `dev → main`, entrega.                                                                         |

## Definition of Done por tarea

### Tarea 1 — Actores y funcionalidades
- [ ] Lista completa de actores con responsabilidades.
- [ ] Lista de funcionalidades por módulo (1-9 del enunciado).
- [ ] Diagrama de casos de uso de los flujos principales (al menos: registro, login, ver situación académica, configurar carrera).
- [ ] PR mergeado a `dev`.

### Tarea 2 — DER
- [ ] Todas las entidades del enunciado modeladas.
- [ ] Cardinalidades definidas.
- [ ] Diagrama exportado como PNG/SVG dentro de `docs/sprint-1/`.
- [ ] PR mergeado a `dev`.

### Tarea 3 — Arquitectura + backend skeleton
- [ ] `docs/arquitectura.md` con stack, estructura, ADRs principales.
- [ ] `/backend/src/` con la estructura `config / models / routes / controllers / services / middlewares / utils`.
- [ ] Conexión a MongoDB funcionando vía `.env` (con `.env.example` versionado).
- [ ] Endpoint `GET /health` que devuelve `{ ok: true }`.
- [ ] PR mergeado a `dev`.

### Tarea 4 — Navegación frontend
- [ ] React Router instalado.
- [ ] Layout base con sidebar/menú.
- [ ] Pantallas dummy para estudiante: Login, Registro, Home, Mi Situación, Asistente, Perfil.
- [ ] Pantallas dummy para admin: Login, Home, Carreras, Planes, Materias, Moderación.
- [ ] Navegación entre todas las pantallas funciona.
- [ ] PR mergeado a `dev`.

## Reglas operativas

- Si te trabás más de 1 hora, avisá en el grupo. No te quedes mudo.
- Cualquier decisión de modelo de datos o nombres de rutas se discute y se documenta.
- Mantener el scope: si algo no está en el alcance del sprint 1, va a backlog (`docs/sprint-2/` futuro).
