# Sprint 4 — 04/06 → 25/06

**Objetivo:** completar sesiones de estudio colaborativo (punto 6) y construir el repositorio de materiales base (punto 7.1 y 7.2).

> La semana del 11/06 queda reservada para presentación de medio término y tareas de bajo riesgo.

## Alcance

1. **Sesiones de estudio colaborativo**:
   - Crear sesión con materia, tema, tipo, fecha, duración, cupos, descripción y aprobación requerida.
   - Sesión virtual con link o presencial con ubicación.
   - Visibilidad según privacidad del creador.
   - Filtros de búsqueda.
   - Inscripción de estudiantes.
   - Aprobación manual si corresponde.
   - Email de confirmación.
   - Editar/cancelar sesión y notificar inscriptos.
   - Recordatorio automático 24h antes.
2. **Materiales base**:
   - Subida de archivos permitidos hasta 25MB.
   - Carga de links externos.
   - Tags/metadata.
   - Listado, búsqueda y filtros.
   - Valoración pulgar arriba/abajo.
   - Totales, ratio y orden por valoración.

## Distribución

| Tarea | Owner | Entregable | Branch sugerida |
|---|---|---|---|
| Modelo + CRUD sesiones + visibilidad | Thomas | `sesion.model.js` + endpoints | `feature/sesiones` |
| Inscripción, aprobación y emails | Thomas | Lógica de cupos/aprobación/confirmación | `feature/sesiones-inscripcion` |
| Job recordatorio 24h | Thomas | Cron/job documentado | `feature/recordatorios-sesiones` |
| UI sesiones | Matías | Crear/listar/filtrar/gestionar sesiones | `feature/sesiones-ui` |
| Storage materiales + validación 25MB | Thomas | `upload.middleware.js` + storage local/S3 decidido | `feature/materiales-storage` |
| CRUD materiales + links + tags | Santino | `material.model.js` + endpoints | `feature/materiales-crud` |
| Valoraciones + ratio + ordenamiento | Santino | Endpoints y agregados de valoración | `feature/materiales-valoracion` |
| UI materiales base | Matías | Listado, filtros, upload/link, valorar | `feature/materiales-ui` |
| Casos de prueba sesiones/materiales | Marcos | Tests + checklist demo | `test/sesiones-materiales` |

## Definition of Done

- [ ] Un estudiante crea sesión virtual/presencial.
- [ ] Otro estudiante se inscribe y recibe confirmación.
- [ ] Si requiere aprobación, el creador puede aprobar/rechazar.
- [ ] Cancelar sesión notifica a inscriptos.
- [ ] Existe recordatorio 24h antes.
- [ ] Estudiantes pueden subir archivos permitidos y links externos.
- [ ] Materiales se listan, filtran, valoran y ordenan por valoración.
- [ ] CI verde y tests de flujos principales.

## Riesgos

- Storage externo puede demorar; si no está listo, usar filesystem local documentado.
- Jobs en desarrollo deben ser fáciles de probar sin esperar 24h.
- La visibilidad de sesiones depende de privacidad/contactos del Sprint 3.

## Cronograma

| Días | Foco |
|---|---|
| 1-3 | Sesiones: modelo, CRUD y visibilidad. |
| 4-5 | Presentación medio término / scope reducido. |
| 6-9 | Inscripción, aprobación, email y recordatorios. |
| 10-13 | Storage y CRUD materiales. |
| 14-16 | Valoraciones + UI materiales. |
| 17-19 | UI sesiones + integración. |
| 20-21 | Tests, demo y documentación. |
