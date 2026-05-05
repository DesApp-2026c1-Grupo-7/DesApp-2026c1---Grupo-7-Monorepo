# Sprint 5 — 25/06 → 16/07

**Objetivo:** puntos 7, 8 y 9 — repositorio de materiales completo (con valoraciones, denuncias y moderación), notificaciones in-app y reportes admin + deploy.

> Alineado con `AGENTS.md` — sección Sprint 5. Con este sprint quedan cubiertos los 9 puntos del TP.

## Alcance
1. **Materiales** (punto 7): subida de archivos (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, ZIP — máx 25MB) y links externos. Tags/metadata. Valoración 👍/👎. Denuncias con motivos configurables + suspensión automática. Panel de moderación admin. **Discord card destacada** (ícono, estilos, botón "Unirse").
2. **Notificaciones in-app** (punto 8): centro de notificaciones (campanita), disparadores de vencimiento de regularidad, eventos de sesiones y eventos de denuncias.
3. **Reportes admin** (punto 9): dashboard con métricas de uso, materias más cursadas, tasa de aprobación, materiales más valorados, estadísticas sociales. Exportación CSV/PDF.
4. **Hardening**: rate limiting, CORS estricto, helmet, validación con Zod en todos los endpoints.
5. **Tests E2E** (Playwright) de los flujos críticos.
6. **Deploy** + documentación de entrega.

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Storage de archivos (multer + S3/local, límite 25MB, formatos validados) | Thomas | `material.service.js` + `upload.middleware.js` | `feature/materiales-storage` |
| CRUD materiales (archivos + links) con tags/metadata + búsqueda | Santino | `material.model.js` + `materiales.controller.js` | `feature/materiales-crud` |
| Sistema de valoración 👍/👎 + ratio + sort | Santino | `valoracion.service.js` | `feature/materiales-valoracion` |
| Sistema de denuncias + motivos configurables + suspensión automática | Thomas | `denuncia.model.js` + `moderacion.service.js` | `feature/materiales-denuncias` |
| Panel de moderación admin | Santino | `moderacion.controller.js` + notificación al autor | `feature/moderacion-admin` |
| UI repositorio de materiales (lista, filtros, ordenamiento, valoración, denuncia) | Matías | `/frontend/src/pages/materiales/*` | `feature/materiales-ui` |
| **Discord card destacada** | Matías | componente `DiscordCard.tsx` con estilos temáticos | `feature/discord-card` |
| Centro de notificaciones in-app (modelo + endpoints + UI campanita) | Santino | `notificacion.model.js` + `NotificacionesBell.tsx` | `feature/notificaciones-inapp` |
| Agregaciones MongoDB (estadísticas) + endpoints reportes | Thomas | `estadisticas.service.js` + `/api/reportes/*` | `feature/stats-reportes` |
| Dashboard admin UI (charts con Recharts) + exportación CSV/PDF | Matías | `/frontend/src/pages/admin/dashboard.tsx` | `feature/dashboard-admin` |
| Hardening (helmet, rate-limit, Zod) | Thomas | middlewares + schemas en todos los endpoints | `feature/hardening` |
| Tests E2E (Playwright) | Thomas | `/e2e/*` con flujos críticos | `feature/e2e-playwright` |
| Deploy + docs entrega | Marcos | README final + URLs prod + manuales | `chore/deploy-y-docs-entrega` |

## DoD del sprint y del proyecto
- [ ] App desplegada y accesible públicamente.
- [ ] Materiales: subida de archivos (todos los formatos, hasta 25MB) y links externos funcionales.
- [ ] Valoraciones 👍/👎 y sistema de denuncias + panel de moderación funcionando.
- [ ] Discord card con estilos temáticos y botón "Unirse".
- [ ] Centro de notificaciones in-app con al menos 3 disparadores distintos.
- [ ] Dashboard admin con al menos 4 gráficos significativos.
- [ ] CSV y PDF de reportes descargables.
- [ ] Suite E2E pasa los flujos críticos: registro → login → asistente → materiales → sesión → notificación → reporte admin.
- [ ] Existe al menos 1 E2E que valida el dashboard admin y la exportación de reportes.
- [ ] Existe al menos 1 prueba de hardening automatizada (autorización/validación/rate limiting).
- [ ] README final con badges (CI, coverage, deploy).
- [ ] Manual de usuario (`docs/manual-usuario.md`) con screenshots.
- [ ] Manual técnico (`docs/manual-tecnico.md`) con diagramas y decisiones de arquitectura.
- [ ] Presentación final lista (`docs/entrega-final/`).

## Cronograma (21 días)
| Días | Foco |
|---|---|
| 1-5 | Materiales: storage, CRUD, valoraciones, denuncias. |
| 6-9 | Moderación + Discord card + notificaciones in-app. |
| 10-13 | Reportes + dashboard admin + exportación. |
| 14-16 | Hardening + Tests E2E. |
| 17-18 | Deploy + smoke tests en prod. |
| 19-20 | Documentación final + manuales. |
| 21 (16/07) | **Entrega final.** |

## Riesgos
- Storage S3: configurar bucket + IAM con tiempo suficiente; si no, usar local con `MAX_FILE_SIZE` y limpieza periódica.
- Atlas/Render free tier puede tener cold starts → documentar al evaluador.
- Playwright en CI: si tarda mucho, correr E2E sólo en `main` (no en cada PR).
- Última semana antes del recuperatorio (23/07): no agregar features, sólo bugfixes.

## Post-entrega
- Recuperatorio de parcial: 23/07. Equipo disponible para fix-ups si algo se rompió.
- Retrospectiva del proyecto completo: documentar lecciones aprendidas en `docs/retrospectiva-final.md`.

