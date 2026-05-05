# Algoritmos del asistente académico

> Diseño de los 4 algoritmos clave del punto 4 del TP. Insumo para sprint 2.
> Pseudocódigo + complejidad + casos borde. Cada uno se traduce 1:1 a un servicio en `/backend/src/services/asistente/`.

---

## 1. Materias inscribibles

**Pregunta que responde:** dado un estudiante, ¿qué materias del plan está habilitado a cursar este cuatrimestre?

### Entradas
- `estudiante` con su `plan` y la lista de `SituacionMateria` (estado por materia: aprobada/regularizada/cursando/no cursada).
- Lista de `Correlatividad { materia, requisito, condicion }` del plan.
- Opcional: `oferta` académica del cuatri (filtro adicional, CdU-19).

### Salida
- `inscribibles[]`: materias que cumplen TODAS sus correlatividades y aún no están aprobadas ni cursando.

### Pseudocódigo
```
function materiasInscribibles(estudiante, plan, correlatividades, oferta = null):
    situacion = mapa { materiaId -> estado } desde estudiante.situaciones
    inscribibles = []

    for materia in plan.materias:
        estadoActual = situacion[materia.id] ?? 'no_cursada'

        # Skip si ya la aprobó o la está cursando
        if estadoActual in ('aprobada', 'cursando'):
            continue

        # Verificar todas las correlatividades de esta materia
        requisitos = correlatividades.filter(c => c.materia == materia.id)
        habilitada = true
        faltantes = []

        for req in requisitos:
            estadoReq = situacion[req.requisito] ?? 'no_cursada'

            if req.condicion == 'aprobada' and estadoReq != 'aprobada':
                habilitada = false
                faltantes.push(req.requisito)
            elif req.condicion == 'regularizada' and estadoReq not in ('regularizada', 'aprobada'):
                habilitada = false
                faltantes.push(req.requisito)

        if habilitada:
            # Filtro extra por oferta del cuatri (si se pasó)
            if oferta == null or materia.id in oferta.materias:
                inscribibles.push({ materia, requisitosCumplidos: requisitos })

    return inscribibles
```

### Complejidad
- O(M * R) donde M = materias del plan, R = promedio de correlatividades por materia. Para planes reales (~40 materias, ~3 correlativas c/u) es despreciable.

### Casos borde
- Materia sin correlatividades → habilitada por defecto si no fue aprobada/cursando.
- Correlatividad apunta a materia fuera del plan (ej. cambio de plan) → tratar como `no_cursada` y bloquear (logear warning).
- Estudiante sin situación cargada → todas las materias sin correlativas son inscribibles.

---

## 2. Porcentaje de avance

**Pregunta:** ¿qué tan cerca está el estudiante de recibirse?

### Métricas a calcular
1. `% materiasAprobadas = aprobadas / total_materias * 100`
2. `% creditosObtenidos = sum(creditos de aprobadas) / sum(creditos del plan) * 100`
3. Por año del plan: `{ año, aprobadas, regularizadas, faltantes, total }`
4. Materias UNaHur: `{ requeridas, cursadas }` (las marcadas `tipo: UNaHur` en el plan).
5. Estimación de cuatris faltantes (usa el planificador, ver § 4).

### Pseudocódigo
```
function calcularAvance(estudiante, plan):
    situaciones = estudiante.situaciones
    materias = plan.materias

    aprobadas = situaciones.filter(s => s.estado == 'aprobada')
    regularizadas = situaciones.filter(s => s.estado == 'regularizada')

    total = materias.length
    porcentajeMaterias = (aprobadas.length / total) * 100

    creditosTotales = sum(materias.map(m => m.creditos))
    creditosObtenidos = sum(aprobadas.map(a => materia(a).creditos))
    porcentajeCreditos = (creditosObtenidos / creditosTotales) * 100

    porAño = {}
    for año in 1..plan.duracion:
        delAño = materias.filter(m => m.año == año)
        porAño[año] = {
            total: delAño.length,
            aprobadas: delAño.filter(m => situaciones[m.id]?.estado == 'aprobada').length,
            regularizadas: delAño.filter(m => situaciones[m.id]?.estado == 'regularizada').length,
        }
        porAño[año].faltantes = porAño[año].total - porAño[año].aprobadas

    unahur = {
        requeridas: materias.filter(m => m.tipo == 'UNaHur').length,
        cursadas: aprobadas.filter(a => materia(a).tipo == 'UNaHur').length,
    }

    return { porcentajeMaterias, porcentajeCreditos, porAño, unahur }
```

### Complejidad
O(M) lineal en cantidad de materias. Trivial.

---

## 3. "¿Qué pasa si...?"

**Pregunta:** si apruebo/regularizo este subset de materias que estoy cursando, ¿qué materias nuevas se desbloquean para el próximo cuatri?

### Entradas
- Estado real del estudiante (su `situacion` actual).
- `hipotesis`: lista de `{ materiaId, estadoHipotetico }` (el estudiante simula el resultado).

### Salida
- `delta`: materias que con el estado actual NO son inscribibles, pero con la hipótesis SÍ lo son.

### Pseudocódigo
```
function quePasaSi(estudiante, plan, correlatividades, hipotesis):
    inscribiblesAhora = materiasInscribibles(estudiante, plan, correlatividades)

    # Crear copia del estudiante con la situación modificada por la hipótesis
    estudianteHipotetico = clone(estudiante)
    for h in hipotesis:
        situacion = estudianteHipotetico.situaciones.find(s => s.materia == h.materiaId)
        situacion.estado = h.estadoHipotetico

    inscribiblesHipoteticas = materiasInscribibles(estudianteHipotetico, plan, correlatividades)

    # Diff: las nuevas que aparecen en hipotético y no estaban en el actual
    idsAhora = set(inscribiblesAhora.map(i => i.materia.id))
    delta = inscribiblesHipoteticas.filter(i => i.materia.id not in idsAhora)

    return {
        actuales: inscribiblesAhora,
        hipoteticas: inscribiblesHipoteticas,
        nuevasDesbloqueadas: delta,
    }
```

### Complejidad
2 corridas de § 1 = O(M * R). Sigue siendo despreciable.

### Notas UX
- El frontend debe permitir seleccionar varias materias `cursando` y togglear cada una entre `regularizada` / `aprobada` / `recursar` para ver el delta en vivo.

---

## 4. Planificador de cursada

**Pregunta:** dadas mis horas/semana disponibles, ¿cómo me organizo cuatri por cuatri hasta recibirme?

### Entradas
- Estado actual del estudiante.
- `horasMaxSemana` (configurable).
- Plan completo + correlatividades.

### Salida
- `plan: [{ cuatri: 1, materias: [...], horasSemana: X }, ...]` hasta cubrir todas las materias.

### Estrategia
Greedy por cuatri: en cada iteración, calcular inscribibles, priorizar las que más desbloquean (centralidad en el grafo de correlativas), llenar hasta `horasMaxSemana`, marcar como `aprobada` hipotéticamente, repetir.

### Pseudocódigo
```
function planificarCursada(estudiante, plan, correlatividades, horasMaxSemana):
    estado = clone(estudiante)
    cuatriNum = 1
    planResult = []

    # Pre-cálculo: cuántas materias depende de cada una (para priorizar)
    centralidad = {}
    for c in correlatividades:
        centralidad[c.requisito] = (centralidad[c.requisito] ?? 0) + 1

    while existenMateriasNoAprobadas(estado, plan):
        inscribibles = materiasInscribibles(estado, plan, correlatividades)

        if inscribibles.empty:
            # Deadlock: hay materias sin aprobar pero ninguna inscribible
            # (caso típico: regularizadas que requieren final aprobado)
            # Avanzar regularizadas a aprobadas (asumir que rinde finales)
            avanzarRegularizadasAAprobadas(estado)
            continue

        # Ordenar por centralidad descendente (las que más desbloquean primero)
        inscribibles.sort((a, b) => centralidad[b.materia.id] - centralidad[a.materia.id])

        # Llenar el cuatri respetando horas máx
        delCuatri = []
        horasUsadas = 0
        for i in inscribibles:
            if horasUsadas + i.materia.horasSemana <= horasMaxSemana:
                delCuatri.push(i.materia)
                horasUsadas += i.materia.horasSemana

        if delCuatri.empty:
            # Configuración imposible: hay materias pendientes e inscribibles,
            # pero ninguna entra dentro de horasMaxSemana.
            # Devolver error claro para que el frontend lo distinga de un plan completo.
            raise Error('No es posible planificar la cursada con el límite de horas semanal configurado')

        # Avanzar el estado: marcar las del cuatri como aprobadas
        for m in delCuatri:
            estado.situaciones.push({ materia: m.id, estado: 'aprobada' })

        planResult.push({ cuatri: cuatriNum, materias: delCuatri, horasSemana: horasUsadas })
        cuatriNum++

        if cuatriNum > 20:
            # Safety break (carrera de 5 años son 10 cuatris, 20 ya es absurdo)
            break

    return planResult
```

### Complejidad
O(C * M * R) donde C = cuatris hasta recibirse (~10). Acotado.

### Casos borde
- Horas/semana insuficiente para la materia más liviana → devolver error claro al usuario.
- Materia optativa: el algoritmo puede agregarla o no según centralidad. El estudiante puede pinearla manualmente (drag & drop UI).
- Estudiante con todo aprobado → devolver `[]`.

### UX (drag & drop)
- El planResult inicial es una sugerencia. El estudiante puede mover materias entre cuatris.
- Al mover, el sistema **revalida correlatividades** y muestra warnings rojos si quedan inválidas. No bloquea, solo avisa.
- Estudiante guarda con un nombre (`PlanCursada { nombre, estudiante, cuatris[] }`) para volver a verlo después.

---

## Implementación recomendada (sprint 2)

```
backend/src/services/asistente/
├── inscribibles.service.js       # § 1
├── avance.service.js             # § 2
├── que-pasa-si.service.js        # § 3
└── planificador.service.js       # § 4
```

Cada uno con su test unitario en `backend/tests/asistente/` con un plan dummy de 5-6 materias y correlatividades chicas. Test-driven, no negociable.

### Endpoints sugeridos
- `GET  /api/asistente/inscribibles` → § 1
- `GET  /api/asistente/avance` → § 2
- `POST /api/asistente/que-pasa-si` (body: hipotesis[]) → § 3
- `POST /api/asistente/planificador` (body: { horasMaxSemana }) → § 4

Todos requieren JWT de estudiante; el `estudianteId` sale del token, no del body.
