# Sprint 4 — 04/06 → 25/06

**Objetivo:** puntos 7 y 8 — repositorio de materiales + sistema de notificaciones.

> Nota: este sprint cruza el medio término (11/06). La semana del parcial es de scope reducido — sólo tareas de bajo riesgo.

## Alcance
1. **Materiales**: estudiantes/admins suben archivos (PDF, links, videos) por materia. Categorización por unidad/tema.
2. **Notificaciones in-app**: vencimiento de regularidades, nuevos materiales, anuncios de admin.
3. **Email transactional**: registro, suspensión de cuenta, recordatorio de finales.
4. **Búsqueda** de materiales (por materia, tema, tipo).

## Distribución

| Tarea | Owner | Entregable | Branch |
|---|---|---|---|
| Modelo Material + storage (S3 o local con multer) | Santino | `material.model.js` + `material.service.js` | `feature/materiales-modelo` |
| Endpoints upload/download/listar materiales | Marcos | `materiales.controller.js` | `feature/materiales-api` |
| UI materiales (lista, upload con preview, búsqueda) | Matías | `/frontend/src/pages/materiales/*` | `feature/materiales-ui` |
| Sistema de notificaciones in-app (modelo + endpoint poll) | Thomas | `notificacion.model.js` + `notificaciones.service.js` | `feature/notificaciones` |
| Email service (nodemailer + templates) | Thomas | `email.service.js` + 4 templates | `feature/email-service` |
| Cron de notificaciones (vencimientos) | Thomas | `cron/vencimientos.js` con `node-cron` | `feature/cron-vencimientos` |

## DoD
- [ ] Subir un PDF de hasta 20MB y descargarlo funciona.
- [ ] Estudiante recibe notificación in-app al vencer una regularidad.
- [ ] Email de bienvenida llega al registrarse.
- [ ] Búsqueda full-text por título/tema funciona.
- [ ] CI verde, sin secretos hardcodeados (todo `.env`).

## Cronograma (21 días, con parcial intercalado)
| Días | Foco |
|---|---|
| 1-5 | Modelos + endpoints materiales. |
| 6-7 | **Parcial 11/06**. Scope congelado. |
| 8-12 | UI materiales + búsqueda. |
| 13-17 | Notificaciones + email + cron. |
| 18-20 | Tests + integración. |
| 21 | Demo + retro. |

## Riesgos
- Storage de archivos: si se va S3, configurar bucket + IAM. Si se queda local, definir `MAX_FILE_SIZE` y limpieza periódica.
- Email en dev: usar Mailtrap o ethereal.email para no spammear.
