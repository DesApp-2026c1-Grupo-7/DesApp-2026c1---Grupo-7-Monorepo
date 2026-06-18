# Planificador con cascada de correlativas — Diseño

- **Fecha:** 2026-06-18
- **Autor:** Grupo 7 (coord. técnico: Thomas)
- **Estado:** Aprobado para implementación
- **Alcance:** Frontend únicamente. Sin cambios de backend.

## Problema

En el Asistente Académico ([`frontend/src/pages/student/AcademicAssistant.tsx`](../../../frontend/src/pages/student/AcademicAssistant.tsx)),
el planificador de cursada arma automáticamente un plan hasta recibirse y permite
mover materias entre cuatrimestres con los botones **◀ ▶** (un cuatrimestre por
click). La función `moverMateria` valida correlatividad y, si el movimiento la
rompe, **frena con un error** y no aplica nada.

El usuario quiere lo contrario: al mover una materia, que el planificador **reacomode
el resto en cascada** — que atrase o adelante las materias relacionadas según
corresponda, dejando siempre un plan válido, en vez de bloquear.

## Objetivo

Reemplazar el "mover y bloquear" por "mover y reacomodar en cascada", con una
interacción de drag & drop pulida y feedback visual de qué se movió.

## Reglas de dominio (las que ya existen, se mantienen)

El plan es una lista ordenada de cuatrimestres (`PlanPeriodo[]`). La regla de validez,
tomada de la `validarPlan` actual:

1. **Correlativa estricta:** para toda materia `S`, cada correlativa `C` de `S` que
   esté dentro del plan debe ubicarse en un cuatrimestre **estrictamente anterior**
   (índice menor) al de `S`. Las correlativas ya aprobadas no figuran en el plan y no
   restringen.
2. **Correlativas en curso:** una materia con `correlativasEnCurso` no puede ubicarse
   en el **primer cuatrimestre proyectado** (`primerPeriodo`), porque esa correlativa
   todavía no está aprobada.

## Comportamiento de la cascada

Cuando el usuario mueve la materia `M` a un cuatrimestre destino `t`:

### Mover hacia adelante (atrasar, `t` > índice actual)
- Se coloca `M` en `t`.
- Se empujan hacia adelante, **en cadena**, las materias que dependen de `M` (las que
  tienen a `M` entre sus correlativas), y recursivamente las que dependen de esas, lo
  **mínimo necesario** para que ninguna quede en el mismo cuatrimestre o antes que su
  correlativa.
- Si hace falta espacio, se **crean cuatrimestres nuevos al final** (siguiendo la
  secuencia 1C → 2C → año+1 1C, igual que hoy).

### Mover hacia atrás (adelantar, `t` < índice actual)
- Se intenta colocar `M` en `t`.
- Se traen hacia adelante, **en cadena**, las correlativas de `M` que quedarían pisadas
  (mismo cuatrimestre o posterior), y recursivamente sus correlativas.
- **Piso:** no se puede programar "en el pasado". El primer cuatrimestre proyectado es
  el índice 0. Si la cadena de correlativas no entra antes de `t`, `M` se frena en el
  **cuatrimestre más temprano factible** (el que dicta la profundidad de su cadena de
  correlativas). Nunca se rompe la regla 1; simplemente `M` no baja más de lo posible.
- La regla 2 (`correlativasEnCurso`) actúa como piso adicional: esas materias no pueden
  caer en el primer cuatrimestre proyectado.

### Invariantes
- Las materias **no relacionadas** con `M` (ni dependientes ni correlativas en la
  cadena) **no se mueven**.
- El resultado **siempre cumple** las reglas 1 y 2.
- **Horas semanales:** se recalculan por cuatrimestre y se mantiene el aviso visual de
  sobrecarga (⚠) cuando se supera `horasPorSemana`. La sobrecarga **no** dispara más
  movimientos: la cascada resuelve correlatividad, no carga horaria.
- Se eliminan los cuatrimestres vacíos sobrantes al final (re-pack), como hoy.

## Arquitectura

### Función pura (núcleo)
Se extrae la lógica de movimiento del componente a un módulo nuevo y testeable:

`frontend/src/utils/planificadorCascada.ts`

```ts
interface ResultadoMovimiento {
  periodos: PlanPeriodo[];   // nuevo plan, ya re-packeado y con horas recalculadas
  movidas: string[];          // ids de materias que cambiaron de cuatrimestre (incluye M)
}

function moverMateriaConCascada(
  periodos: PlanPeriodo[],
  materiaId: string,
  destinoIdx: number,
  opciones: { primerPeriodoIdx: number }
): ResultadoMovimiento
```

- Pura: no muta la entrada, no toca estado de React, no hace I/O.
- Devuelve `movidas` para que la UI resalte lo que se reacomodó.
- `primerPeriodoIdx` permite aplicar la regla 2 (normalmente 0).

El componente `AcademicAssistant.tsx` reemplaza el cuerpo de `moverMateria` por una
llamada a esta función, y agrega un handler de drag & drop que llama a la **misma**
función con el `destinoIdx` correspondiente.

### Sin cambios de backend
El plan lo genera el backend (`GET /academico/planificador`), pero el reacomodo ya es
client-side. El guardado sigue usando `POST /academico/planes-guardados` con el plan
reacomodado tal cual. No se toca ningún endpoint ni modelo.

## UX / UI

- **Drag & drop** como interacción principal: cada cuatrimestre es una zona de drop;
  cada materia tiene un handle arrastrable. Se prioriza una librería con soporte de
  teclado y accesibilidad (p. ej. `@dnd-kit`); decisión final de librería/layout en
  implementación usando las skills de diseño.
- **Fallback ◀ ▶:** se mantienen los botones actuales (accesibilidad por teclado, no
  rompen los tests E2E existentes, sirven para saltos finos). Ambos caminos invocan la
  misma función pura.
- **Feedback de cascada:** las materias incluidas en `movidas` se resaltan con un pulso
  breve y aparece un aviso no bloqueante ("Se reacomodaron N materias"). Sin diálogo de
  confirmación.
- Se mantiene el aviso de sobrecarga horaria (⚠) por cuatrimestre.

## Tests

### Unitarios (función pura)
- Atrasar `M`: empuja en cadena a sus dependientes lo mínimo necesario.
- Adelantar `M`: trae en cadena a sus correlativas; respeta el piso (no baja del índice
  factible).
- Tope por `correlativasEnCurso`: no cae en el primer cuatrimestre.
- Materias no relacionadas: permanecen en su cuatrimestre.
- Creación de cuatrimestres nuevos al atrasar más allá del último.
- Re-pack: se eliminan cuatrimestres vacíos al final.
- Idempotencia/validez: el resultado siempre satisface las reglas 1 y 2.

> Nota de implementación: verificar qué runner de unit tests tiene el frontend (Vitest,
> Jest). Si no hay ninguno configurado, agregar Vitest (mínimo, ya que Vite está
> presente) para esta función pura.

### E2E (Cypress/Playwright, suite existente)
- Drag & drop de una materia que dispara cascada y deja el plan válido.
- Fallback con botones ◀ ▶ con cascada.

## Fuera de alcance (YAGNI)

- Reacomodo por carga horaria (la cascada solo resuelve correlatividad).
- Persistencia automática tras cada movimiento (se sigue guardando con el botón
  "Guardar plan").
- Undo/redo del reacomodo.
- Cambios de backend.

## Features relacionadas (sub-proyectos aparte, no en este spec)

- **Login con Google (SSO)** vía Google Cloud Console (OAuth Client ID) + verificación
  en backend con `google-auth-library`, manteniendo el JWT propio.
- **Materiales en bucket real** con Google Cloud Storage (billing ya habilitado en GCP),
  reemplazando el `multer.diskStorage` local actual.

Stack elegido para ambas: **todo Google** (un solo proyecto GCP), sin Supabase.
