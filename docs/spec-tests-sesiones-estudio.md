# Spec de tests — Sesiones de Estudio

Documento de referencia para los tests de los 4 escenarios de Sesiones de Estudio.
Implementación:
- Backend: [`backend/test/study-sessions.test.js`](../backend/test/study-sessions.test.js).
- Cypress E2E: [`frontend/cypress/e2e/sesiones.cy.ts`](../frontend/cypress/e2e/sesiones.cy.ts).

## Hechos del código en los que se apoya el spec

- **Endpoints** (`/api/sesiones`, todos requieren login + rol `student`):
  `POST /` crear · `GET /` listar activas · `GET /:id` detalle · `PUT /:id` editar (solo creador) ·
  `DELETE /:id` cancelar (solo creador) · `POST /:id/join` unirse · `POST /:id/leave` darse de baja ·
  `POST /manage-request` `{sessionId, userId, action:'approve'|'reject'}` · `POST /:id/kick/:userId`.
- **Flag "aprobar manualmente"** = campo `requiereAprobacion`. Si es `false`: al unirse entra directo **y se
  envía mail de confirmación**. Si es `true`: se crea una `solicitud` pendiente y **el mail de confirmación
  recién sale cuando el creador aprueba**.
- **Privacidad del listado**: creador con perfil `publico` → lo ven todos; perfil `privado` → **solo sus
  contactos**. (Escenario 3.)
- **Mails** (`mail.service.js`): `sendSessionConfirmationEmail`, `sendSessionCancellationEmail`,
  `sendSessionReminderEmail`. Sin `MAIL_HOST` el transporter es un mock que loguea a consola.
- **Recordatorio 24hs** (`reminder.service.js`): `checkAndSendReminders()` busca sesiones `activa`,
  `recordatorioEnviado:false`, con `fechaHora` entre *ahora* y *ahora+24h*, manda mail a cada participante y
  marca `recordatorioEnviado:true`. Corre cada 1 min vía `setInterval`, pero la función está exportada y se
  invoca directo en el test.

## Decisión de fondo: qué va a backend y qué a Cypress

Los mails y el cron de recordatorio **no se pueden verificar desde Cypress** (el navegador no ve la casilla de
correo, y el `setInterval` de 24hs no es observable en un E2E). Reparto:

| Aspecto a verificar | Backend (`node:test`) | Cypress (E2E) |
|---|---|---|
| Reglas de negocio (join/aprobación/privacidad/cancelar/baja) | ✅ fuente de verdad | ✅ pero solo el flujo visible |
| **Envío de mails** (confirmación, cancelación, recordatorio) | ✅ **acá y solo acá** (spy sobre `mail.service`) | ❌ no aplica |
| **Recordatorio 24hs** | ✅ invocando `checkAndSendReminders()` | ❌ no aplica |
| Filtros de UI, badges "✓ Eres miembro", modal de miembros | ➖ | ✅ acá |

En backend los mails se verifican **espiando** las funciones de `mail.service` con `t.mock.method` de
`node:test` (no se manda correo real; se asserta que la función fue llamada con el destinatario correcto).

## Parte A — Backend: `backend/test/study-sessions.test.js`

**Setup (`test.before`)**, siguiendo el patrón de `sprint2.test.js`: `MongoMemoryServer` + `mongoose.connect`,
carrera + 1 materia (vía admin bootstrap), 3 estudiantes registrados/logueados (`prueba`, `matias`, `privado`).
`privado` con `configuracionPrivacidad.perfil='privado'` y `contactos=[matias]`; `matias.contactos=[privado]`.
`prueba` queda deliberadamente fuera de los contactos de `privado`.

### Escenario 1 — sesión abierta (`requiereAprobacion:false`)
1. Crea sesión sin aprobación manual → el creador queda como primer participante.
2. Matías y Privado ven la sesión abierta en el listado (creador público).
3. Al unirse (sin aprobación) entran directo **y se envía mail de confirmación** a cada uno (spy: 2 llamadas).
4. El creador puede editar su sesión; un no-creador recibe 403.
5. El creador puede crear varias sesiones.
6. El creador cancela → **mail de cancelación** a los participantes, **no** a sí mismo.
7. (Extra) Un participante puede darse de baja; el creador no (400).

### Escenario 2 — sesión con aprobación (`requiereAprobacion:true`)
8. Al solicitar unirse queda `pendiente` y **NO** se manda mail todavía.
9. Si el creador rechaza → solicitud `rechazada`, no queda participante, sin mail.
10. Si el creador aprueba → participante + solicitud `aprobada` + **mail de confirmación**.
11. Solo el creador puede gestionar solicitudes (otro usuario → 403).

### Escenario 3 — privacidad por contactos
12. Un contacto (Matías) puede ver la sesión de un creador privado.
13. Un no-contacto (Estudiante de Prueba) **no** la ve.
14. Un contacto puede unirse a la sesión del creador privado.

### Escenario 4 — recordatorio 24hs
15. Sesión dentro de las próximas 24h → recordatorio a cada participante; `recordatorioEnviado:true`.
16. No se reenvía si ya fue enviado.
17. Sesión a más de 24h → no dispara recordatorio.

## Parte B — Cypress: `frontend/cypress/e2e/sesiones.cy.ts`

Corre contra backend+frontend reales, logueando con usuarios del seed. Verifica lo **visible** (los mails los
cubre backend). Cada `it` crea su propia sesión con un tema único (`Date.now()`) para ser autónomo:

1. Escenario 1 — crear sesión abierta, otro se une y queda como miembro ("Unirse" → "✓ Eres miembro").
2. Escenario 1 — el creador edita su sesión.
3. Escenario 1 — filtro "Mis inscripciones", se ve como miembro y se da de baja.
4. Escenario 1 — el creador cancela la sesión (desaparece del listado activo).
5. Escenario 2 — solicitar unirse ("Solicitar unirse" → "Pendiente de aprobación"), el dueño acepta a Matías y rechaza a Privado.
6. Escenario 3 — visibilidad por contactos (Matías la ve y se une, Prueba no la ve).

> Escenario 4 (recordatorio 24hs) **no tiene caso Cypress** — se cubre 100% en backend.

## Mapa escenario → tests

| Escenario | Backend (`study-sessions.test.js`) | Cypress (pendiente) |
|---|---|---|
| 1 (abierta, ver/unirse, mail conf., editar, varias, baja, cancelar+mail) | 1–7 | 1–4 |
| 2 (aprobación, aceptar/rechazar, mail al aprobar) | 8–11 | 5 |
| 3 (privacidad por contactos) | 12–14 | 6 |
| 4 (recordatorio 24hs) | 15–17 | — |
