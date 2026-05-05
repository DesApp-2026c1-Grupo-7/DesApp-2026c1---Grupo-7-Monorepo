# Casos de uso detallados — Puntos 1 a 4

> Insumo para sprint 2. Cada CdU describe actor, precondición, flujo principal, flujos alternativos y postcondición.

---

## CdU-01 — Registro de estudiante
- **Actor:** visitante.
- **Precondición:** ninguna.
- **Flujo principal:**
  1. Visitante entra a `/registro`.
  2. Completa: nombre, apellido, DNI, email, password, carrera/s en las que se inscribe.
  3. Sistema valida: email único, password fuerte, DNI único.
  4. Sistema crea `Estudiante`, hashea password, devuelve JWT.
  5. Sistema redirige a su Home.
- **Flujos alternativos:**
  - 3a. Email ya registrado → mostrar error y volver al form.
- **Postcondición:** estudiante creado, autenticado.

## CdU-02 — Login
- **Actor:** estudiante o admin.
- **Flujo principal:** email + password → JWT con `rol` (estudiante/admin) → redirige a Home según rol.
- **Alternativos:** credenciales inválidas → 401 + mensaje.

## CdU-03 — Admin da de alta otro admin
- **Actor:** admin autenticado.
- **Flujo:** desde `/admin/usuarios/nuevo` carga datos de nuevo admin → sistema valida + crea `Administrador` + envía email con credenciales temporales.

## CdU-04 — Admin suspende cuenta de estudiante
- **Actor:** admin.
- **Flujo:** desde `/admin/usuarios` busca estudiante → click "Suspender" → cuenta queda con `estado = suspendido`.
- **Reactivación:** mismo flujo, click "Reactivar".

## CdU-05 — Admin crea una carrera
- **Actor:** admin.
- **Flujo:** desde `/admin/carreras/nueva` carga: nombre, título que otorga, instituto, duración (años) → crea `Carrera`.
- **Alternativos:** nombre repetido → error.

## CdU-06 — Admin crea un plan de estudios
- **Actor:** admin.
- **Flujo:** desde `/admin/carreras/{id}/planes/nuevo` carga: nombre del plan (ej "Plan 2020"), estado (Vigente/En transición/Discontinuado) → crea `PlanEstudio` asociado a la carrera.

## CdU-07 — Admin agrega materias a un plan
- **Actor:** admin.
- **Flujo:** desde `/admin/planes/{id}/materias` carga c/u: nombre, año (1-N), modalidad (anual/cuatrimestral), tipo (obligatoria/optativa/UNaHur), créditos que da, requisitos especiales (nivel inglés, etc).

## CdU-08 — Admin define correlatividades
- **Actor:** admin.
- **Flujo:** desde `/admin/materias/{id}/correlatividades` selecciona qué materias son requisito (aprobadas o regularizadas, distinguir el tipo).
- **Postcondición:** se guarda lista de `Correlatividad { materia, requisito, condicion: 'aprobada' | 'regularizada' }`.

---

## CdU-09 — Estudiante carga situación académica manual
- **Actor:** estudiante autenticado por primera vez.
- **Flujo:** desde `/situacion/inicial` el sistema lista las materias del plan de su carrera → estudiante marca cada una como `aprobada` / `regularizada` / `no cursada` con año y cuatrimestre → sistema crea `SituacionMateria` por cada una.

## CdU-10 — Estudiante carga situación académica desde Excel
- **Actor:** estudiante.
- **Flujo principal:**
  1. Sube archivo `.xlsx` con columnas: `materia | estado | año | cuatrimestre | nota`.
  2. Sistema parsea y muestra **preview** con: filas válidas (verde), filas con error (rojo + motivo).
  3. Estudiante corrige errores en el preview o vuelve a subir.
  4. Click "Confirmar" → sistema persiste todas las `SituacionMateria` válidas.
- **Errores típicos:** materia inexistente, estado inválido, cuatrimestre fuera de rango.

## CdU-11 — Estudiante registra inscripción del cuatrimestre
- **Actor:** estudiante (al inicio de cada cuatri).
- **Flujo:** elige las materias en las que se inscribió → sistema valida correlatividades → crea `SituacionMateria` con estado `cursando`, año/cuatrimestre actual.

## CdU-12 — Estudiante registra resultado de cursada
- **Actor:** estudiante (al fin del cuatri).
- **Flujo:** lista materias `cursando` → marca cada una como `aprobada` / `regularizada` / `recursar` (con nota si aprobó) → sistema actualiza `SituacionMateria`.

## CdU-13 — Estudiante registra final
- **Actor:** estudiante.
- **Flujo:** elige una materia `regularizada` → carga fecha + resultado (aprobado/desaprobado) + nota si aprobó → sistema crea/actualiza `Final { materia, intentos, ultimoResultado, fechaUltimoIntento }`.

---

## CdU-14 — Estudiante consulta materias en las que puede inscribirse
- **Actor:** estudiante.
- **Flujo:** entra a `/asistente` → sistema corre algoritmo de inscribibles → lista materias con badge "puede inscribirse" + las correlativas que ya cumplió.
- **Algoritmo:** ver `algoritmos-asistente.md` § 1.

## CdU-15 — Estudiante consulta finales pendientes
- **Actor:** estudiante.
- **Flujo:** sistema lista materias `regularizada` → para cada una muestra: intentos previos, fecha de último intento, fecha de vencimiento de la regularidad (calculada según reglas UNaHur).
- **Vencimiento:** regularidad dura 4 cuatrimestres desde que se regularizó (parametrizable).

## CdU-16 — Estudiante consulta % de avance
- **Actor:** estudiante.
- **Flujo:** sistema calcula:
  - `aprobadas / total_materias_plan * 100`
  - Para cada año del plan: aprobadas / regularizadas / faltantes.
  - Créditos faltantes para recibirse.
  - Materias UNaHur faltantes.

## CdU-17 — "¿Qué pasa si...?"
- **Actor:** estudiante.
- **Flujo:** estudiante marca un subset de materias `cursando` como hipotéticamente regularizadas/aprobadas → sistema recalcula inscribibles para el próximo cuatri y muestra el delta (materias nuevas que se desbloquean).
- **Algoritmo:** ver `algoritmos-asistente.md` § 3.

## CdU-18 — Planificador de cursada
- **Actor:** estudiante.
- **Flujo:**
  1. Estudiante indica horas/semana que puede cursar.
  2. Sistema genera plan tentativo cuatrimestre por cuatri respetando correlatividades hasta recibirse.
  3. Estudiante puede mover materias a otros cuatris (drag & drop).
  4. Sistema recalcula carga horaria de cada cuatri al mover.
  5. Estudiante guarda el plan con un nombre.
- **Algoritmo:** ver `algoritmos-asistente.md` § 4.

## CdU-19 — Admin carga oferta académica del período
- **Actor:** admin.
- **Flujo:** desde `/admin/oferta/{periodo}` selecciona qué materias de cada plan se dictan en el cuatri actual.
- **Uso:** filtra los resultados de CdU-14 a sólo las que se ofrecen.
