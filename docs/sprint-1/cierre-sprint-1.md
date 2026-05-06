# Cierre Sprint 1 - 16/04 -> 07/05

## Alcance original

La ficha pedia actores, DER, navegacion basica, version preliminar funcional de puntos 1 a 4 y tests basicos.

## Estado real

PR #10 dejo la base mergeada. La rama `feature/cerrar-deuda-puntos-1-4` cierra la deuda restante:

- Punto 1: usuarios, auth, admins, listado, suspension/reactivacion.
- Punto 2: carreras, planes, materias, correlativas, campos exactos y estado de plan.
- Punto 3: situacion academica, Excel preview/correccion/confirmacion, cursadas, finales, actividades con creditos.
- Punto 4: inscribibles, finales con intentos/vencimiento, avance, oferta, que-pasa-si y planificador.
- Plus punto 4: comparacion de rendimiento real contra plan de estudio y guardado de multiples planificaciones.
- Excel de prueba: `docs/sprint-1/situacion-academica-ejemplo.xlsx`.
- Tests reales: `backend/test/sprint1-debt.test.js`.

## Fuera de alcance

Puntos 5 a 9 quedan para sprints siguientes: red social, sesiones, materiales, notificaciones y reportes.

## Demo sugerida

1. Login admin.
2. Crear carrera/plan/materias con correlativas.
3. Gestionar usuarios.
4. Configurar oferta academica.
5. Login estudiante.
6. Cargar situacion manual o Excel con preview.
7. Registrar actividad con creditos.
8. Usar asistente: disponibles, finales, avance, que-pasa-si y planificador.
9. Comparar rendimiento vs plan y guardar una planificacion por horas semanales.

## Validacion

- `cd backend && npm test`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
