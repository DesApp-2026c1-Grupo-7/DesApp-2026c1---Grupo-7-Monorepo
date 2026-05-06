# Ajustes sugeridos para Trello — Sprint 1

> No se actualizó Trello desde el repo. Este documento deja el estado que debería reflejar el board.

## Card Sprint 1

Estado sugerido: **En revisión / pendiente de cierre**, no "Hecho" todavía.

Motivo:
- La ficha pedía versión preliminar funcional hasta el punto 4.
- El trabajo existe en PR #10, pero al 06/05/2026 el PR sigue abierto.
- Faltan tests básicos reales.

Checklist recomendado:

- [x] Actores y funcionalidades.
- [x] DER.
- [x] Arquitectura, repo, CI y flujo de trabajo.
- [x] Navegación básica estudiante/admin.
- [x] Backend skeleton + healthcheck.
- [x] Auth real + guards por rol.
- [x] CRUD académico preliminar.
- [x] Situación académica preliminar.
- [x] Asistente académico básico.
- [ ] PR #10 mergeado a `dev`.
- [ ] CI verde después del merge.
- [ ] Tests básicos reales de puntos 1 a 4.
- [ ] README y docs finales de Sprint 1 actualizados.

## Nueva card sugerida

Título: **Cierre puntos 1-4: deuda Sprint 1 / Sprint 2**

Descripción:
Cerrar los faltantes detectados después de revisar la ficha original de Sprint 1 y PR #10. La demo preliminar existe, pero faltan tests, ajustes de consigna y proyecciones completas.

Checklist:
- [ ] Resolver comentarios del review del PR #10.
- [ ] Mergear PR #10 a `dev` con CI verde.
- [ ] Tests de auth y autorización.
- [ ] Tests de CRUD académico.
- [ ] Tests de situación académica/importación.
- [ ] Tests de asistente académico.
- [ ] Admin crea otros admins.
- [ ] Admin lista cuentas.
- [ ] Admin suspende/reactiva usuarios.
- [ ] Carrera: agregar título, instituto y duración.
- [ ] Plan: usar estado Vigente / En transición / Discontinuado.
- [ ] Excel: preview con errores antes de confirmar.
- [ ] Excel: corrección de filas antes de confirmar.
- [ ] Actividades con créditos.
- [ ] Oferta académica por período.
- [ ] "¿Qué pasa si...?"
- [ ] Planificador por horas/semana.
- [ ] Vencimiento de regularidad en finales pendientes.

## Cards que no deberían darse por hechas todavía

- Red social académica.
- Sesiones de estudio.
- Materiales.
- Denuncias y moderación.
- Notificaciones in-app.
- Reportes.

Hoy existen pantallas placeholder o navegación para algunas de esas áreas, pero no funcionalidad backend/frontend completa según la consigna.
