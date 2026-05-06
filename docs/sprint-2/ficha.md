# Sprint 2 - 07/05 -> 21/05

**Objetivo actualizado:** con la deuda de puntos 1 a 4 cerrada en `feature/cerrar-deuda-puntos-1-4`, Sprint 2 puede empezar con punto 5 sin arrastrar trabajo fantasma.

## Base cerrada antes de avanzar

- PR #10 mergeado a `dev`.
- Review comments del PR #10 resueltos.
- Tests reales de backend con `node --test`, `supertest` y Mongo en memoria.
- Punto 1 completo para el alcance inicial: registro, login, seed admin, admins creados por admin, listado de cuentas, suspension/reactivacion.
- Punto 2 completo para el alcance inicial: carreras/planes/materias, correlativas, campos exactos de carrera y estado de plan.
- Punto 3 completo para el alcance inicial: carga manual, Excel preview/correccion/confirmacion, cursadas, finales y actividades con creditos.
- Punto 4 completo para el alcance inicial: inscribibles, finales con intentos/vencimiento, avance, oferta academica, que-pasa-si y planificador.

## Alcance Sprint 2

1. Perfil de estudiante:
   - Datos personales.
   - Carrera/s y situacion academica visible segun permisos.
   - Foto.
   - Privacidad publico/privado.
   - Toggles para mostrar email, mostrar situacion academica y publicar eventos.
2. Conexiones:
   - Invitacion por email.
   - Aceptar/rechazar por link.
   - Login previo si hace falta.
   - Aviso al invitador si el email no pertenece a un usuario registrado.
   - Pantalla de contactos y solicitudes pendientes.
3. Feed inicial:
   - Eventos academicos de contactos.
   - Posteos manuales.
   - Respeto de privacidad/toggles.
4. Servicio de email transaccional para invitaciones y futuros flujos.

## Distribucion sugerida

| Tarea | Owner | Entregable | Branch sugerida |
|---|---|---|---|
| Modelo + endpoints de perfil y privacidad | Santino | Perfil y reglas de visibilidad | `feature/perfil-estudiante` |
| UI perfil con foto y toggles | Matias | Pantalla perfil conectada | `feature/perfil-ui` |
| Servicio de email dev | Thomas | Mailer configurable por `.env` | `feature/email-service` |
| Invitaciones por email + aceptar/rechazar | Thomas | Endpoints con token de invitacion | `feature/invitaciones-email` |
| Modelo + endpoints de contactos | Santino | Contactos y solicitudes | `feature/contactos` |
| UI contactos y solicitudes | Matias | Pantalla mis contactos | `feature/contactos-ui` |
| Feed/eventos/posteos | Santino | Modelo y endpoints | `feature/feed` |
| UI feed | Matias | Feed conectado | `feature/feed-ui` |
| Casos de prueba y demo | Marcos | Tests + checklist demo | `test/social-basico` |

## Definition of Done

- [ ] Un estudiante puede editar perfil y privacidad.
- [ ] Dos estudiantes pueden conectarse por invitacion de email.
- [ ] Se pueden aceptar/rechazar solicitudes con login previo.
- [ ] Feed muestra eventos academicos y posteos respetando privacidad/toggles.
- [ ] Hay tests de endpoints principales.
- [ ] CI verde.
- [ ] Trello refleja que puntos 1 a 4 quedaron cerrados y que Sprint 2 arranca en punto 5.
