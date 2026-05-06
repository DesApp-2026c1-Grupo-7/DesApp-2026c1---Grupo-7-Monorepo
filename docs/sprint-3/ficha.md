# Sprint 3 — 21/05 → 04/06

**Objetivo:** arrancar y dejar demostrable el punto 5, Red Social Académica, más una base de email reutilizable para conexiones y sesiones.

> Este sprint asume que Sprint 2 cerró los puntos 1 a 4. Si queda deuda crítica del asistente o tests, entra como bugfix/hardening, no como feature nueva.

## Alcance

1. **Perfil de estudiante**:
   - Datos personales.
   - Carrera/s y situación académica visible según permisos.
   - Foto.
   - Privacidad público/privado.
   - Toggles para mostrar email, mostrar situación académica y publicar eventos.
2. **Conexiones**:
   - Invitación por email.
   - Aceptar/rechazar por link.
   - Login previo si el usuario no está autenticado.
   - Aviso al invitador si el email no pertenece a un usuario registrado.
   - Pantalla de contactos y solicitudes pendientes.
3. **Feed inicial**:
   - Eventos académicos de contactos: inscripción, regularización, aprobación.
   - Posteos manuales de estudiantes.
   - Respeto de toggles de publicación.
4. **Email transaccional base**:
   - Servicio de mail en dev con Ethereal/Mailtrap.
   - Templates simples para invitaciones y avisos.

## Distribución

| Tarea | Owner | Entregable | Branch sugerida |
|---|---|---|---|
| Modelo + endpoints de perfil y privacidad | Santino | `perfil.controller.js`, reglas de visibilidad | `feature/perfil-estudiante` |
| UI perfil con foto y toggles | Matías | Pantalla perfil conectada | `feature/perfil-ui` |
| Servicio de email dev + templates | Thomas | `email.service.js` configurado por `.env` | `feature/email-service` |
| Invitaciones por email + aceptar/rechazar | Thomas | Endpoints + tokens de invitación | `feature/invitaciones-email` |
| Modelo + endpoints de contactos | Santino | Contactos y solicitudes pendientes | `feature/contactos` |
| UI contactos y solicitudes | Matías | Pantalla "mis contactos" | `feature/contactos-ui` |
| Modelo + endpoints feed/eventos/posteos | Santino | `EventoFeed` + endpoints | `feature/feed` |
| UI feed | Matías | Feed con eventos y posteos | `feature/feed-ui` |
| Casos de uso y pruebas sociales | Marcos | Tests + documentación de demo | `test/social-basico` |

## Definition of Done

- [ ] Un estudiante puede editar perfil y privacidad.
- [ ] Dos estudiantes pueden conectarse por invitación de email.
- [ ] Se pueden aceptar/rechazar solicitudes con login previo si hace falta.
- [ ] Feed muestra eventos académicos y posteos respetando privacidad/toggles.
- [ ] Hay tests de los endpoints principales.
- [ ] CI verde.
- [ ] Demo preparada para antes de la presentación de medio término.

## Riesgos

- Email puede trabarse por configuración externa; usar proveedor de desarrollo desde el día 1.
- Privacidad cruza perfil, contactos y feed; definir reglas simples antes de implementar.
- Si el punto 4 queda incompleto, priorizar estabilidad antes de sumar feed avanzado.

## Cronograma

| Días | Foco |
|---|---|
| 1-3 | Perfil, privacidad y servicio de email. |
| 4-6 | Invitaciones y contactos. |
| 7-9 | Feed y eventos académicos. |
| 10-12 | UI completa + pruebas. |
| 13-14 | Demo, bugfixes y documentación. |
