# Spec de tests — Denuncias de Materiales (motivos)

Documento de referencia para los 6 escenarios de denuncia de un material, uno por cada
**motivo** disponible en el sistema.

Implementación (pendiente, aún no codeada):
- Backend: `backend/test/material-report-motivos.test.js` (archivo nuevo).
- Cypress E2E: `frontend/cypress/e2e/denuncias.cy.ts` (archivo nuevo).

## Decisiones tomadas

1. Se hacen **backend (`node:test`) y Cypress**.
2. **Archivos nuevos** (no se toca `material-report.test.js`).
3. **Un material por escenario** (cada test crea su propio material y lo denuncia; nada compartido).
4. Se **verifican las notificaciones** generadas al aceptar/rechazar, tanto al **denunciante** como
   al **autor** del material.

## Hechos del código en los que se apoya el spec

- **Crear denuncia**: `POST /api/denuncias` (requiere login; estudiante o admin).
  Body: `{ materialId, reasonId, motivoEspecifico?, detalle }`.
  - `detalle` → **obligatorio siempre** (schema `MaterialReport.detalle.required`).
  - `motivoEspecifico` → **obligatorio solo si** el motivo es `"Otro"` (validado en el controller
    comparando `reason.titulo.toLowerCase() === 'otro'`).
  - Respuesta `201` con `{ mensaje, report }`, `report.estado === 'pendiente'`.
- **Regla de negocio**: el autor **no puede** denunciar su propio material → `400`.
- **Material inexistente** → `404`; **motivo inexistente** → `404`.
- **Listar motivos**: `GET /api/denuncias/reasons` (activos, ordenados por `orden`).
- **Admin**: `GET /api/denuncias` lista todo con `motivo` poblado (`titulo`); `PATCH /:id/status`
  cambia estado (`pendiente` | `revisado` | `ignorado`).
- **Motivos sembrados** (`seedReportReasons`): en tests con Mongo en memoria el seed NO corre solo,
  así que hay que crearlos en el `test.before`.

| # escenario | Motivo (título real) | orden |
|---|---|---|
| 1 | `Contenido pornográfico o sexual explícito` | 1 |
| 2 | `Lenguaje ofensivo o insultos` | 2 |
| 3 | `Material protegido por derechos de autor` | 3 |
| 4 | `Spam o publicidad engañosa` | 4 |
| 5 | `Información incorrecta o engañosa` | 5 |
| 6 | `Otro` (+ `motivoEspecifico`) | 6 |

## Cobertura vs. lo existente

`material-report.test.js` ya cubre: crear denuncia genérica, `"Otro"` sin especificar (`400`),
`"Otro"` con `motivoEspecifico` (`201`) y gestión admin. **Lo nuevo** de este spec es verificar
**cada uno de los 6 motivos reales** de punta a punta: que la denuncia se crea, queda `pendiente`,
guarda el `motivo` correcto y el admin lo ve con el `titulo` esperado.

## Formato

Se mantiene el formato del resto de la suite: `node:test` (`test('...')` planos, sin `describe`),
`assert/strict`, `supertest` contra el `app` real y `MongoMemoryServer` en `test.before`/`test.after`.

## Setup (`test.before`)

1. `MongoMemoryServer` + `mongoose.connect`.
2. Bootstrap admin (login → `adminToken`).
3. Carrera + 1 materia (vía admin).
4. Dos estudiantes: `autor` (sube los materiales) y `denunciante` (hace las denuncias) — el autor no
   puede denunciar su propio material, por eso hacen falta dos.
5. Crear los **6 motivos reales** (títulos y `orden` de la tabla) vía `POST /api/denuncias/reasons`
   como admin; guardar sus `_id` en un mapa por título.
6. Un helper `crearMaterial()` (POST `/api/materiales` como `autor`, `tipo: 'link'`) para que **cada
   escenario cree su propio material** y lo denuncie de forma aislada.

## Escenarios (casos de test propuestos)

Cada escenario es un `test('...')` que hace `POST /api/denuncias` como `denunciante` con el
`reasonId` correspondiente y asserta la creación. Detalle común de aserciones:
`status 201`, `report.estado === 'pendiente'`, `report.motivo === reasonId`.

### Escenario 1 — Contenido pornográfico
- **Body**: `{ materialId, reasonId: <Contenido pornográfico...>, detalle: 'El material contiene imágenes pornográficas' }`
- **Espera**: `201`, `estado: 'pendiente'`, `motivo` = id del motivo 1.

### Escenario 2 — Lenguaje ofensivo o insultos
- **Body**: `{ materialId, reasonId: <Lenguaje ofensivo...>, detalle: 'Incluye insultos y lenguaje ofensivo' }`
- **Espera**: `201`, `estado: 'pendiente'`, `motivo` = id del motivo 2.

### Escenario 3 — Derechos de autor
- **Body**: `{ materialId, reasonId: <Material protegido...>, detalle: 'Es material con copyright subido sin permiso' }`
- **Espera**: `201`, `estado: 'pendiente'`, `motivo` = id del motivo 3.

### Escenario 4 — Spam o publicidad engañosa
- **Body**: `{ materialId, reasonId: <Spam o publicidad...>, detalle: 'Es publicidad engañosa, no es material de estudio' }`
- **Espera**: `201`, `estado: 'pendiente'`, `motivo` = id del motivo 4.

### Escenario 5 — Información incorrecta o engañosa
- **Body**: `{ materialId, reasonId: <Información incorrecta...>, detalle: 'Los datos del apunte son incorrectos' }`
- **Espera**: `201`, `estado: 'pendiente'`, `motivo` = id del motivo 5.

### Escenario 6 — Otro (con descripción extra)
- **Body**: `{ materialId, reasonId: <Otro>, motivoEspecifico: 'No es contenido correspondiente a esta materia', detalle: 'Subido en la materia equivocada' }`
- **Espera**: `201`, `estado: 'pendiente'`, `motivo` = id del motivo 6, y `report.motivoEspecifico`
  guardado con el texto de la descripción extra.

### Escenario 7 — El admin puede ver las denuncias
- **Acción**: como admin, `GET /api/denuncias`.
- **Espera**: `200`, un array con las 6 denuncias creadas, cada una con `motivo.titulo` poblado y
  el `denunciante` poblado (confirma el `populate` y que cada denuncia guardó el motivo real).
- **Negativo sugerido**: un estudiante (`denunciante`) que llama `GET /api/denuncias` → `403`
  (la ruta es `authorize('admin')`).

### Escenario 8 — El admin puede aceptar una denuncia
- **Acción**: `PATCH /api/denuncias/:id/status` con `{ estado: 'revisado', resolucion: 'Contenido verificado y dado de baja' }`.
  ("Aceptar" una denuncia = marcarla como `revisado`.)
- **Espera**: `200`, `report.estado === 'revisado'` y `report.resolucion` guardada.
- **Notificaciones (incluido)**: verificar en la colección `Notification` que se creó una para el
  `denunciante` (título "Denuncia aceptada") y otra para el `autor` del material (título
  "Material reportado y aceptado").

### Escenario 9 — El admin puede rechazar una denuncia
- **Acción**: `PATCH /api/denuncias/:id/status` con `{ estado: 'ignorado', resolucion: 'La denuncia no corresponde' }`.
  ("Rechazar" una denuncia = marcarla como `ignorado`.)
- **Espera**: `200`, `report.estado === 'ignorado'` (y `resolucion` guardada).
- **Notificaciones (incluido)**: verificar en `Notification` que se creó una para el `denunciante`
  (título "Denuncia desestimada") y otra para el `autor` (título "Denuncia rechazada").
- **Negativo sugerido**: un estudiante intentando `PATCH .../status` → `403`.

### Escenario 10 — 2 denuncias: el material sigue visible
- **Precondición**: material del `autor`, **2** denuncias pendientes (umbral por defecto `nPending=3`).
- **Espera**:
  - otro estudiante (no autor): `GET /api/materiales` lo devuelve, `suspendido: false`, `url` presente.
  - el creador: lo ve con `pendingReports: 2` y `suspendido: false` (ve su material como denunciado,
    pero no suspendido).

### Escenario 11 — 3 denuncias: el material queda suspendido
- **Precondición**: material del `autor`, **3** denuncias pendientes.
- **Espera**:
  - otro estudiante (no autor): `GET /api/materiales` **no** lo devuelve (queda oculto).
  - admin: lo ve con `suspendido: true` y la `url` real.
  - creador: lo ve con `suspendido: true`, `pendingReports: 3` y `url: null` (contenido enmascarado;
    ve que está denunciado/suspendido pero no puede abrirlo).

### Escenario 12 — el creador elimina su material
- **Acción**: `DELETE /api/materiales/:id` como `autor` (material no suspendido) → `200`.
- **Espera**: el material deja de aparecer en `GET /api/materiales`.
- **Negativo**: otro estudiante intentando `DELETE` el material ajeno → `403`.
- **Nota UI (Cypress)**: el botón de eliminar solo aparece si `(autor||admin) && (no suspendido ||
  admin)`; por eso el creador borra un material **no suspendido** (uno suspendido solo lo puede borrar
  el admin desde la UI).

## Mapa escenario → test

| Escenario | Motivo | Test |
|---|---|---|
| 1 | Contenido pornográfico o sexual explícito | crea denuncia motivo 1 |
| 2 | Lenguaje ofensivo o insultos | crea denuncia motivo 2 |
| 3 | Material protegido por derechos de autor | crea denuncia motivo 3 |
| 4 | Spam o publicidad engañosa | crea denuncia motivo 4 |
| 5 | Información incorrecta o engañosa | crea denuncia motivo 5 |
| 6 | Otro + motivoEspecifico | crea denuncia motivo 6 |
| 7 | Gestión admin | el admin lista y ve las 6 (+ negativo estudiante → 403) |
| 8 | Gestión admin | el admin **acepta** una denuncia (estado `revisado`) |
| 9 | Gestión admin | el admin **rechaza** una denuncia (estado `ignorado`) |
| 10 | Visibilidad | 2 denuncias → material visible (creador lo ve denunciado, no suspendido) |
| 11 | Visibilidad | 3 denuncias → suspendido: oculto a otros, admin ve url, creador ve enmascarado |
| 12 | Ciclo de vida | el creador **elimina** su material (+ negativo otro → 403) |

## Parte B — Cypress: `frontend/cypress/e2e/denuncias.cy.ts`

Corre contra backend+frontend reales con los usuarios del seed. Las **notificaciones NO se
verifican acá** (van en backend); Cypress verifica el flujo visible.

**UI real** (ya relevada):
- Estudiante en `/student/materials`: se elige una materia (`.repository-card`) → se listan los
  materiales. El botón de denunciar (`.btn-report`, 🚩) aparece **solo si el material no es propio y
  no está suspendido**. Abre el modal `Denunciar Material` con `select[name="reasonId"]`, input
  `name="motivoEspecifico"` (solo si el motivo es "Otro"), textarea `name="detalle"` y botón
  **"Enviar Denuncia"**. Éxito → toast "Denuncia enviada correctamente...".
- Admin en `/admin/moderation`: cada denuncia es una `.report-card` con su `estado`; si está
  `pendiente` muestra **"Confirmar Denuncia"** (→ `revisado`) y **"Rechazar Denuncia"** (→ `ignorado`).
  Éxito → toast "Denuncia confirmada con éxito" / "Denuncia rechazada".

**Consideración importante**: para no toparse con la suspensión (a las 3 pendientes el 🚩
desaparece) y con la regla de autor, cada escenario denuncia un **material distinto** de **otro
autor**. Se loguea como un estudiante que no sea el autor de esos materiales.

Casos:
1. Escenario 1–5 (uno por motivo): abrir el modal en un material ajeno, elegir el motivo del
   dropdown, completar detalle, **Enviar Denuncia** → toast de éxito.
2. Escenario 6 — "Otro": al elegir "Otro" aparece el campo **"Especificar motivo"**; se completa con
   "No es contenido correspondiente a esta materia" + detalle → toast de éxito.
3. Escenario 7 — admin: en `/admin/moderation` se ven las denuncias (al menos una `.report-card`
   con su motivo).
4. Escenario 8 — admin **acepta**: en una denuncia `pendiente`, "Confirmar Denuncia" → toast
   "Denuncia confirmada" y la card pasa a estado `revisado`.
5. Escenario 9 — admin **rechaza**: en otra denuncia `pendiente`, "Rechazar Denuncia" → toast
   "Denuncia rechazada" y la card pasa a estado `ignorado`.
6. Escenario 10 — material con denuncias **visible**: un estudiante (no autor) ve en BD1 un material
   con 2 denuncias sembradas ("Archivo Word", no suspendido).
7. Escenario 11 — material **suspendido**: el mismo estudiante **no** ve "Archivo PDF" (suspendido en
   el seed), pero su **creador** sí lo ve con el badge "Suspendido".
8. Escenario 12 — el creador **elimina** su material: abre el modal "¿Eliminar material?" y confirma;
   la card desaparece. Negativo: en un material ajeno **no** aparece el botón de eliminar.

> Para los casos admin (8–9) se puede actuar sobre denuncias **ya sembradas** por el seed (hay varias
> `pendiente`), o crear una fresca vía el flujo del estudiante dentro del mismo test. Los casos 10–11
> se apoyan en materiales sembrados con conteos conocidos ("Archivo Word" = 2 denuncias, "Archivo PDF"
> = suspendido).

## Solapamiento con `material-report.test.js` (respuesta directa)

Los dos archivos son **independientes** (cada uno levanta su propia Mongo en memoria), así que **no
se pisan ni se rompen entre sí**. Ahora bien, a nivel *comportamiento ejercitado* sí hay algunas
repeticiones parciales, y conviene tenerlas claras:

| Comportamiento | `material-report.test.js` (existente) | Spec nuevo | ¿Redundante? |
|---|---|---|---|
| Crear denuncia válida | sí (motivo "Spam" ad-hoc) | Sc 1–5 (motivos reales) | Parcial (mismo verbo, motivos distintos → suma cobertura) |
| "Otro" con `motivoEspecifico` → 201 | sí | Sc 6 (positivo) | Parcial (Sc6 además asserta que se persiste) |
| Admin lista denuncias | sí | Sc 7 (+ 403 estudiante) | Parcial (el 403 es nuevo) |
| Admin marca `revisado` | sí | Sc 8 (+ notificaciones) | Parcial (las notificaciones son nuevas) |
| Admin marca `ignorado` | no | Sc 9 | **No, es nuevo** |
| Notificaciones al aceptar/rechazar | no | Sc 8 y 9 | **No, es nuevo** |
| Cada motivo real 1..6 | no | Sc 1–6 | **No, es nuevo** |

**No hay ningún duplicado literal**: los escenarios del spec cubren exactamente lo pedido. Solo
quedan solapamientos **parciales** (crear denuncia, "Otro" con especificación, listar admin, marcar
`revisado`), y cada caso nuevo agrega algo que el test existente no tiene (motivos reales, el 403,
las notificaciones, y todo el flujo de rechazo). Recomendación: mantener el archivo nuevo autónomo y
legible como suite de escenarios. Si preferís redundancia cero, puedo recortar Sc7/Sc8 para no
repetir el "listar" y el "revisado" y apoyarme en el existente — decime.
