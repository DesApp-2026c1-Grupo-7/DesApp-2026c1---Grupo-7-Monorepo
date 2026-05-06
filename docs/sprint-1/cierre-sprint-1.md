# Cierre Sprint 1 - 16/04 -> 07/05

## Alcance original de la ficha

La ficha de principio de sprint pedia:

1. Identificar actores y funcionalidades principales.
2. Realizar el DER.
3. Implementar navegacion basica entre pantallas principales.
4. Implementar una version preliminar funcional de los puntos 1 a 4 del TP.
5. Implementar tests unitarios basicos para entidades y funcionalidades principales.

## Estado real al 06/05/2026

El PR #10 quedo mergeado a `dev` y dejo una base preliminar de los puntos 1 a 4. La rama `feature/cerrar-deuda-puntos-1-4` completa la deuda que habia quedado para poder considerar cerrada la base academica inicial.

| Frente | Estado | Evidencia |
|---|---|---|
| Actores, funcionalidades, DER y arquitectura | Hecho | Docs de Sprint 1 |
| Navegacion y skeleton front/back | Hecho | PRs iniciales |
| Punto 1 - Usuarios | Hecho para alcance Sprint 1 | Registro estudiante, login JWT, seed admin, alta de admins, listado de cuentas, suspension/reactivacion |
| Punto 2 - Configuracion academica | Hecho para alcance Sprint 1 | CRUD carreras/planes/materias, correlativas, creditos, UNAHUR/optativas, campos exactos de carrera y estado de plan |
| Punto 3 - Situacion academica | Hecho para alcance Sprint 1 | `Grade`, carga manual, Excel preview/correccion/confirmacion, inscripciones, cierre, finales, actividades con creditos |
| Punto 4 - Asistente academico | Hecho para alcance Sprint 1 | Inscribibles, finales con intentos/vencimiento, avance, analisis por anio, oferta, que-pasa-si, planificador |
| Tests basicos | Hecho | `backend/test/sprint1-debt.test.js` con Mongo en memoria |

## Que queda fuera

Esto no implementa los puntos 5 a 9. Quedan para los siguientes sprints:

- Red social academica.
- Sesiones de estudio colaborativo.
- Materiales, valoraciones, denuncias y moderacion.
- Notificaciones in-app.
- Reportes y estadisticas.

## Demo sugerida

1. Login admin seed.
2. Crear/editar carrera con titulo, instituto y duracion.
3. Crear/editar plan con estado `Vigente`, `En transicion` o `Discontinuado`.
4. Cargar materias y correlativas.
5. Gestionar usuarios: crear admin, listar cuentas, suspender/reactivar estudiante.
6. Configurar oferta academica por periodo.
7. Login estudiante.
8. Cargar situacion manual o Excel con preview, correccion y confirmacion.
9. Registrar actividad con creditos.
10. Ver asistente: inscribibles, finales, avance, que-pasa-si y planificador por horas.

## Validacion

- `cd backend && npm test`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
