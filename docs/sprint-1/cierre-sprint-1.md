# Cierre Sprint 1 — 16/04 → 07/05

## Alcance original de la ficha

La ficha de principio de sprint definió estos objetivos:

1. Identificar actores y funcionalidades principales.
2. Realizar el DER.
3. Implementar navegación básica entre pantallas principales del sistema (Estudiante y Administrador).
4. Implementar una versión preliminar del sistema que cubra las funcionalidades principales de los puntos 1 a 4 del TP:
   - Gestión de usuarios.
   - Configuración académica.
   - Gestión de situación académica.
   - Asistente académico, situación actual y proyecciones de cursada.
5. Implementar tests unitarios básicos para entidades y funcionalidades principales.

## Estado real al 06/05/2026

El Sprint 1 no quedó solamente en documentación y skeleton: además de lo planificado originalmente, se avanzó fuerte en implementación funcional hasta el punto 4. Ese avance está concentrado en el PR #10, que todavía está abierto contra `dev`.

| Frente | Estado | Evidencia |
|---|---|---|
| Actores y funcionalidades | Hecho | PR #3, `docs/sprint-1/actores-y-funcionalidades.md` |
| DER | Hecho | PR #4, `docs/sprint-1/DER.md` |
| Arquitectura, CI y flujo de trabajo | Hecho | PR #2, `CONTRIBUTING.md`, `docs/arquitectura.md` |
| Navegación básica y frontend skeleton | Hecho | PR #1, #5, #6 |
| Backend skeleton con Mongo y healthcheck | Hecho | PR backend skeleton, `/api/health` |
| Auth real + guards por rol | Hecho parcial | PR #8/#9, modelo `User`, JWT, seed admin, `ProtectedRoute` |
| Configuración académica | Hecho parcial | PR #10: carreras, materias, planes, correlativas, créditos, inglés, optativas/UNAHUR |
| Situación académica | Hecho parcial | PR #10: `Grade`, carga manual, import Excel/CSV, inscripción, cierre de cuatri |
| Asistente académico | Hecho parcial | PR #10: disponibles, avance, finales pendientes, análisis por año, proyección básica |
| Tests unitarios básicos | Pendiente | No hay suite real; `backend npm test` todavía es placeholder |

## Qué se hizo de los puntos 1 a 4

### Punto 1 — Gestión de usuarios

Hecho:
- Modelo `User` con roles `student` y `admin`.
- Registro de estudiantes.
- Login con JWT.
- Seed de administrador inicial.
- Guards de navegación frontend por rol.
- Middlewares backend `auth` y `authorize`.

Pendiente:
- Discriminators explícitos `Estudiante` / `Administrador`, o justificar que el equipo usa `role`.
- Admin da de alta otros admins.
- Admin lista todas las cuentas.
- Admin suspende/reactiva cuentas.
- Tests de auth y autorización.

### Punto 2 — Configuración académica

Hecho:
- CRUD backend y frontend de carreras.
- CRUD backend y frontend de planes de estudio.
- CRUD backend y frontend de materias.
- Correlatividades entre materias.
- Materias por año y cuatrimestre/anual.
- Créditos, materias optativas, materias UNAHUR y nivel de inglés.

Pendiente:
- Alinear campos de carrera con la consigna: `titulo`, `instituto`, `duracionAnios`.
- Alinear estado del plan con la consigna: `Vigente`, `En transición`, `Discontinuado` en lugar de solo `activo`.
- Validaciones y mensajes de error más robustos.
- Tests de CRUD y correlatividades.

### Punto 3 — Gestión de situación académica

Hecho:
- Modelo `Grade` como situación por estudiante y materia.
- Estados extendidos: pendiente, inscripto, cursando, regular, aprobada, libre, promoción.
- Carga manual desde UI.
- Import Excel/CSV con procesamiento y feedback.
- Inscripción a materias.
- Registro de cierre de cuatrimestre.
- Modelo y endpoints de finales.

Pendiente:
- Preview real antes de confirmar importación Excel; hoy el import procesa directo.
- Corrección manual de filas en el preview antes de confirmar.
- Actividades con créditos.
- Evitar duplicados de finales pendientes.
- Tests de importación, inscripción, cierre y finales.

### Punto 4 — Asistente académico

Hecho:
- Materias disponibles respetando correlatividades.
- Finales pendientes.
- Créditos faltantes y materias UNAHUR faltantes.
- Análisis por año.
- Porcentaje de avance.
- Proyección básica agrupada por año/cuatrimestre.
- UI conectada al backend para asistente.

Pendiente:
- Vencimiento de regularidad en finales pendientes.
- Oferta académica por período y filtro de disponibles.
- "¿Qué pasa si...?" explícito.
- Planificador por horas semanales hasta recibirse.
- Movimiento manual de materias en el planificador y carga horaria por cuatrimestre.
- Plus: comparar rendimiento real vs plan.
- Plus: guardar varios planes.
- Tests de algoritmos.

## Cosas adelantadas respecto del plan escrito anterior

El plan anterior decía que Excel, finales/cierre y proyecciones quedaban para Sprint 3. En la práctica ya se adelantaron dentro del PR #10:

- Import Excel/CSV de situación académica.
- Inscripción a cursada.
- Cierre de cuatrimestre.
- Presentaciones a finales.
- Proyección básica.
- Admin CRUD completo con pantallas de crear/editar/detalle.

Esto no es trabajo de puntos 5 a 9; sigue estando dentro de los puntos 1 a 4, pero estaba mal ubicado en la planificación anterior.

## Bloqueantes antes de dar Sprint 1 por cerrado

1. Resolver o decidir los comentarios del review de PR #10.
2. Agregar tests básicos reales para auth, CRUD académico y asistente.
3. Actualizar el PR #10 para que diga "Sprint 1" y no "Sprint 2".
4. Actualizar Trello: la card de Sprint 1 debe quedar como parcialmente completa hasta que PR #10 esté mergeado y los tests existan.
5. Mover a una card nueva los pendientes explícitos de "Cierre puntos 1-4".

## Demo Sprint 1 actualizada

1. Mostrar documentación: actores, DER y arquitectura.
2. Levantar backend y verificar `/api/health`.
3. Login como admin seed.
4. Crear carrera, plan y materias con correlatividades.
5. Login como estudiante seed.
6. Cargar situación académica manual o por archivo.
7. Ver asistente: disponibles, avance, análisis por año y finales pendientes.
8. Mostrar en GitHub que PR #10 está abierto contra `dev` con reviewers solicitados.

## Retrospectiva

Funcionó bien:
- El equipo avanzó más de lo mínimo y dejó una demo funcional de puntos 1 a 4.
- La navegación y el backend ya están conectados en los flujos principales.

Hay que corregir:
- La documentación quedó atrasada y nombró como Sprint 2 trabajo que pertenece al alcance original de Sprint 1.
- Faltan tests reales, que sí estaban pedidos en la ficha.
- Hay que cuidar mejor la definición de "hecho": PR abierto no cuenta como cerrado hasta merge, CI y review.
