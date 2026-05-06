# DesApp 2026c1 - Grupo 7

Sistema web para acompañar alumnos universitarios en la planificación de su trayectoria académica y en la organización de actividades de estudio colaborativas.

**Materia:** Desarrollo de Aplicaciones - UNaHur, cuatrimestre 2026c1.

## Equipo

| Integrante         | GitHub                | Rol principal                  |
|--------------------|------------------------|--------------------------------|
| Thomas Casco       | @ThomasCasco           | Coordinación técnica / DevOps  |
| Santino Galdín     | @SantinoGaldin1        | Backend                        |
| Matías López       | @Matias1345            | Frontend                       |
| Marcos Bejarano    | @Marcos0129            | Backend / Datos                |
| Nicolás de la Fuente | @nicolasdelaFuente-Unahur | Docente                  |

(Roles tentativos, rotamos si hace falta.)

## Estructura del repo

```
.
├── backend/         # API Node.js + Express + Mongoose
├── frontend/        # SPA React + Vite + TypeScript
├── docs/            # Documentación de diseño, DER, arquitectura, sprints
├── .github/         # Workflows CI y plantillas
├── CONTRIBUTING.md  # Cómo trabajamos (LEER ANTES DE EMPEZAR)
└── README.md
```

## Setup rápido

Requisitos: Node 20+, npm 10+, MongoDB local o Atlas.

```bash
git clone https://github.com/<org>/DesApp-2026c1---Grupo-7-Monorepo.git
cd DesApp-2026c1---Grupo-7-Monorepo

# Backend
cd backend && npm install && npm run dev

# Frontend (otra terminal)
cd ../frontend && npm install && npm run dev
```

## Flujo de trabajo

Lee [`CONTRIBUTING.md`](./CONTRIBUTING.md). Resumen:

- `main` = entregable estable, **protegida**.
- `dev` = integración del equipo.
- `feature/*` y `fix/*` salen de `dev` y vuelven a `dev` por PR.
- Cada PR necesita 1 review aprobada y CI en verde.
- Conventional Commits en español (`feat:`, `fix:`, `docs:`, ...).

## Sprints

| Sprint | Inicio | Fin | Alcance |
|---|---|---|---|
| 1 | 16-04-2026 | 07-05-2026 | Actores, DER, arquitectura, navegación básica y versión preliminar funcional de puntos 1-4 |
| 2 | 07-05-2026 | 21-05-2026 | Deuda post PR #10: tests, ajustes de consigna, Excel preview, proyecciones y planificador |
| 3 | 21-05-2026 | 04-06-2026 | Red social académica: perfil, privacidad, contactos y feed |
| 4 | 04-06-2026 | 25-06-2026 | Sesiones de estudio y materiales base |
| 5 | 25-06-2026 | 16-07-2026 | Moderación, notificaciones, reportes, deploy y cierre |

Detalle en [`AGENTS.md`](./AGENTS.md) y en [`docs/sprint-1/`](./docs/sprint-1/), [`docs/sprint-2/`](./docs/sprint-2/), [`docs/sprint-3/`](./docs/sprint-3/), [`docs/sprint-4/`](./docs/sprint-4/) y [`docs/sprint-5/`](./docs/sprint-5/).

Estado al 06/05/2026: el PR #10 ya fue mergeado a `dev` con CI verde. La base preliminar de puntos 1 a 4 existe; Sprint 2 queda reservado para cerrar deuda funcional y tests reales.

## Documentación

- [`docs/arquitectura.md`](./docs/arquitectura.md) — decisiones técnicas y estructura del sistema.
- [`docs/sprint-1/actores-y-funcionalidades.md`](./docs/sprint-1/actores-y-funcionalidades.md) — actores y casos de uso.
- [`docs/sprint-1/DER.md`](./docs/sprint-1/DER.md) — modelo de datos.
- [`docs/sprint-1/division-de-tareas.md`](./docs/sprint-1/division-de-tareas.md) — quién hace qué este sprint.
