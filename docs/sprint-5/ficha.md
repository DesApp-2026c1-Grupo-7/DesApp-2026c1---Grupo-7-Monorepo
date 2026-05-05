# Sprint 5 — 25/06 → 16/07

**Objetivo:** punto 9 (reportes admin + métricas) + pulido final + entrega.

## Alcance
1. **Dashboard admin**: métricas de uso, materias más cursadas, tasa de aprobación, alumnos en riesgo.
2. **Reportes exportables**: CSV/PDF de estadísticas por carrera, plan, año.
3. **Hardening**: rate limiting, CORS estricto, helmet, validación con Zod en todos los endpoints.
4. **Tests E2E** (Playwright) de los flujos críticos.
5. **Documentación de entrega**: README con setup, manual de usuario, manual técnico.
6. **Deploy**: backend en Render/Railway, frontend en Vercel, Mongo en Atlas.

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Agregaciones MongoDB (estadísticas) | Santino | `estadisticas.service.js` con pipelines | `feature/stats-agregaciones` |
| Dashboard admin UI (charts con Recharts) | Matías | `/frontend/src/pages/admin/dashboard.tsx` | `feature/dashboard-admin` |
| Exportación CSV/PDF de reportes | Marcos | endpoints `/api/reportes/*` | `feature/reportes-exportar` |
| Hardening (helmet, rate-limit, Zod) | Thomas | middlewares + schemas en todos los endpoints | `feature/hardening` |
| Tests E2E (Playwright) | Thomas | `/e2e/*` con 6 flujos críticos | `feature/e2e-playwright` |
| Deploy + docs entrega | Thomas | README final + URLs prod + manual usuario | `chore/deploy-y-docs-entrega` |

## DoD del sprint y del proyecto
- [ ] App desplegada y accesible públicamente.
- [ ] Dashboard admin con al menos 4 gráficos significativos.
- [ ] CSV y PDF de reportes descargables.
- [ ] Suite E2E pasa los 6 flujos base: registro → login → carga situación → ver asistente → cargar final → admin crea carrera.
- [ ] Existe al menos 1 E2E específico del sprint que valida acceso y render del dashboard admin con métricas/gráficos visibles.
- [ ] Existe al menos 1 E2E específico del sprint que valida exportación de reportes en CSV y PDF desde `/api/reportes/*`.
- [ ] Existe al menos 1 prueba E2E o smoke automatizada para hardening de endpoints (autorización/validación/rate limiting) sobre los cambios de este sprint.
- [ ] README final con badges (CI, coverage, deploy).
- [ ] Manual de usuario (`docs/manual-usuario.md`) con screenshots.
- [ ] Manual técnico (`docs/manual-tecnico.md`) con diagramas y decisiones.
- [ ] Presentación final lista (`docs/entrega-final/`).

## Cronograma (21 días)
| Días | Foco |
|---|---|
| 1-5 | Agregaciones + dashboard. |
| 6-9 | Exportación reportes + hardening. |
| 10-14 | Tests E2E. |
| 15-18 | Deploy + smoke tests en prod. |
| 19-20 | Documentación final. |
| 21 (16/07) | **Entrega final.** |

## Riesgos
- Atlas/Render free tier puede tener cold starts → documentar al evaluador.
- Playwright en CI: si tarda mucho, correr E2E sólo en `main` (no en cada PR).
- Última semana antes del recuperatorio (23/07): no agregar features, sólo bugfixes.

## Post-entrega
- Recuperatorio de parcial: 23/07. Equipo disponible para fix-ups si algo se rompió.
- Retrospectiva del proyecto completo: documentar lecciones aprendidas en `docs/retrospectiva-final.md`.
