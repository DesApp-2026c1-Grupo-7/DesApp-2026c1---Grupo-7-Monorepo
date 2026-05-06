# DesApp 2026c1 - Grupo 7

Sistema web para acompaniar alumnos universitarios en la planificacion de su trayectoria academica y en actividades de estudio colaborativas.

## Setup rapido

```bash
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

## Validacion

```bash
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm run build
```

## Sprints

| Sprint | Inicio | Fin | Alcance |
|---|---|---|---|
| 1 | 16-04-2026 | 07-05-2026 | Actores, DER, arquitectura, navegacion basica y puntos 1-4 cerrados para alcance inicial |
| 2 | 07-05-2026 | 21-05-2026 | Red social academica: perfil, privacidad, contactos y feed |
| 3 | 21-05-2026 | 04-06-2026 | Sesiones de estudio colaborativo |
| 4 | 04-06-2026 | 25-06-2026 | Repositorio de materiales base y valoraciones |
| 5 | 25-06-2026 | 16-07-2026 | Moderacion, notificaciones, reportes, deploy y cierre |

Estado al 06/05/2026: la deuda de puntos 1 a 4 quedo cerrada en `feature/cerrar-deuda-puntos-1-4`, con tests reales de backend, frontend conectado y documentacion actualizada.

## Documentacion

- [`AGENTS.md`](./AGENTS.md) - plan vivo, backlog y estado real.
- [`docs/arquitectura.md`](./docs/arquitectura.md) - decisiones tecnicas.
- [`docs/sprint-1/cierre-sprint-1.md`](./docs/sprint-1/cierre-sprint-1.md) - cierre funcional de puntos 1 a 4.
- [`docs/sprint-2/ficha.md`](./docs/sprint-2/ficha.md) - plan actualizado para red social academica.
