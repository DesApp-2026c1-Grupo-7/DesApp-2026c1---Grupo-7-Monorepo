# Sprint 4 — 04/06 → 25/06

**Objetivo:** puntos 5 y 6 — red social académica (conexiones + feed) y sesiones de estudio colaborativo.

> Nota: este sprint cruza el medio término (11/06). La semana del parcial es de scope reducido — sólo tareas de bajo riesgo.
> Alineado con `AGENTS.md` — sección Sprint 4.

## Alcance
1. **Perfil social**: privacidad (público/privado), toggles de eventos a publicar.
2. **Conexiones**: invitación por email, aceptar/rechazar vía link, pantalla "mis contactos" + solicitudes pendientes.
3. **Feed**: eventos académicos de contactos (inscripción, regularización, aprobación) + posteos manuales.
4. **Sesiones de estudio**: crear, buscar (filtros), inscribirse, aprobación manual del creador, email de confirmación, cancelar con notificación.
5. **Email transaccional**: servicio de mail configurado (registro, invitaciones, confirmación de sesión).
6. **Job de recordatorio** 24h antes de cada sesión (cron).

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Sistema de invitaciones por email + aceptar/rechazar | Thomas | `invitaciones.service.js` + templates | `feature/invitaciones-email` |
| Modelo + endpoints de contactos | Santino | `contacto.model.js` + `contactos.controller.js` | `feature/contactos` |
| UI de contactos + solicitudes pendientes | Matías | `/frontend/src/pages/social/Contactos.tsx` | `feature/contactos-ui` |
| Modelo + endpoints `EventoFeed` | Santino | `eventoFeed.model.js` + `feed.controller.js` | `feature/feed` |
| UI feed de novedades + posteos manuales | Matías | `/frontend/src/pages/social/Feed.tsx` | `feature/feed-ui` |
| Sesiones: modelo + CRUD + visibilidad por privacidad del creador | Thomas | `sesion.model.js` + `sesiones.controller.js` | `feature/sesiones` |
| Inscripción a sesión + aprobación manual + email de confirmación | Thomas | lógica en `sesiones.service.js` + `email.service.js` | `feature/sesiones-inscripcion` |
| UI sesiones (crear, listar con filtros, inscribirse, gestionar) | Matías | `/frontend/src/pages/sesiones/*` | `feature/sesiones-ui` |
| Job de recordatorio 24h antes (cron) | Thomas | `cron/sesiones.js` con `node-cron` | `feature/cron-sesiones` |
| Casos de prueba flujos sociales y sesiones | Marcos | `/backend/tests/integration/social/*` | `feature/tests-social` |

## DoD
- [ ] Dos estudiantes se conectan vía invitación por email y se ven en "mis contactos".
- [ ] Feed muestra eventos académicos de contactos (inscripción, regularización, aprobación) y posteos manuales.
- [ ] Estudiante puede crear una sesión de estudio (virtual/presencial), otro puede inscribirse y recibe email de confirmación.
- [ ] Creador puede aprobar/rechazar inscripciones si la sesión requiere aprobación.
- [ ] Job de recordatorio 24h antes enviado correctamente.
- [ ] CI verde, sin secretos hardcodeados (todo `.env`).

## Cronograma (21 días, con parcial intercalado)
| Días | Foco |
|---|---|
| 1-3 | Modelos contactos + feed + sesiones. |
| 4-5 | Endpoints contactos + invitaciones. |
| 6-7 | **Parcial 11/06**. Scope congelado. |
| 8-11 | UI contactos + feed. Endpoint sesiones. |
| 12-15 | UI sesiones + inscripción + aprobación. |
| 16-18 | Email service + cron de recordatorio. |
| 19-20 | Tests de integración. |
| 21 | Demo + retro. |

## Riesgos
- Email en dev: usar Mailtrap o ethereal.email para no spammear.
- Definir proveedor de mail (SMTP / SendGrid / Mailgun) al inicio del sprint.
- Feed con muchos eventos puede requerir paginación: implementar desde el inicio.

