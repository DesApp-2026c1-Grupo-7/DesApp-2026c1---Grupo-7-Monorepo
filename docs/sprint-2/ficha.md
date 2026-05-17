# Sprint 2 - 07/05 -> 21/05

**Objetivo:** implementar la red social académica (punto 5) sin arrastrar deuda de puntos 1-4.

## Base cerrada al inicio del sprint

- PR #10 mergeado: cierre funcional preliminar puntos 1-4.
- Deuda puntos 1-4 saldada en `feature/cerrar-deuda-puntos-1-4` (PR #12).
- Backend tests reales con `node:test` + Mongo en memoria.
- Frontend lint y build verde.
- Tema premium aplicado a todas las páginas (PR #17).

## Alcance Sprint 2 — estado al cierre

| # | Feature | Estado | PR |
|---|---------|--------|----|
| 1 | Perfil de estudiante (datos, carrera, situación, foto) | ✅ Mergeado | #18 |
| 2 | Privacidad público/privado | ✅ Mergeado | #18 |
| 3 | Toggles: email, situación académica y eventos | ✅ Mergeado / PR abierto | #18 + #21 |
| 4 | Invitaciones por email (Nodemailer) | ✅ Mergeado | #19 |
| 5 | Aceptar/rechazar por link con login previo | ✅ Mergeado | #19 |
| 6 | Aviso si destinatario no está registrado | ✅ Mergeado | #19 |
| 7 | Pantalla de contactos y solicitudes pendientes | ✅ Mergeado | #19 |
| 8 | Feed de eventos académicos y posteos | ✅ PR abierto | #21 |

## Definition of Done

- [x] Un estudiante puede editar perfil y privacidad. *(PR #18 mergeado)*
- [x] Dos estudiantes pueden conectarse por invitación. *(PR #19 mergeado)*
- [x] Se pueden aceptar/rechazar solicitudes. *(PR #19 mergeado)*
- [x] Feed respeta privacidad/toggles. *(PR #21 — pendiente merge)*
- [x] Hay tests de endpoints principales. *(PR #21 — 7 tests verdes)*
- [ ] CI verde. *(verificar después del merge de #20 y #21)*

## PRs del sprint

| PR | Título | Estado |
|----|--------|--------|
| #18 | feat: implementa perfil de estudiante y privacidad | ✅ Mergeado 13/05 |
| #19 | feat: invitaciones por email y gestión de contactos | ✅ Mergeado 14/05 |
| #20 | fix: búsqueda social, privacidad externa y responsivo | ⚠️ Abierto — requiere fix ReDoS y token antes del merge |
| #21 | feat: feed de eventos, toggle privacidad, búsqueda segura y tests | ✅ Abierto — listo para review |

## Notas de cierre

- PR #20 tiene dos observaciones de seguridad (ReDoS en búsqueda, token de invitación expuesto en la respuesta del perfil público). La búsqueda segura ya está implementada en PR #21; al mergear #21 primero y luego rebasar #20 se resuelve el conflicto.
- El feed no incluye paginación (suficiente para sprint 2; agregar en sprint 3 si hace falta).
- El toggle `mostrarEventos` fue introducido en PR #21 junto con el modelo `Event`.
