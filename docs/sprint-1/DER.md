# DER - Diagrama Entidad-Relación

> Punto 2 del sprint 1. **Owner:** TBD. **Estado:** borrador inicial, hay que validar y dibujar.

## Entidades principales (borrador)

### Usuario
- `_id`
- `email` (único)
- `passwordHash`
- `tipo`: `estudiante` | `administrador`
- `nombre`, `apellido`
- `foto` (url)
- `estado`: `activo` | `suspendido`
- `createdAt`, `updatedAt`

### Estudiante (extiende Usuario)
- `dni`
- `legajo`
- `carreras` → ref a Carrera (puede cursar más de una)
- `privacidad`: `publico` | `privado`
- `mostrarEmail`: bool
- `mostrarSituacionAcademica`: bool
- `publicarEventos`: { inscripciones, regularizaciones, aprobaciones }: bool

### Administrador (extiende Usuario)
- `creadoPor` → ref a Administrador

### Carrera
- `_id`
- `nombre`
- `tituloOtorgado`
- `instituto`
- `duracionAnios`

### PlanDeEstudio
- `_id`
- `carrera` → ref a Carrera
- `nombre` (ej: "Plan 2020")
- `estado`: `vigente` | `en_transicion` | `discontinuado`
- `creditosRequeridos`
- `materiasUnahurRequeridas`
- `nivelInglesRequerido`

### Materia
- `_id`
- `plan` → ref a PlanDeEstudio
- `nombre`
- `codigo`
- `anio`
- `cuatrimestralidad`: `anual` | `cuatrimestral`
- `cargaHoraria`
- `creditos`
- `esOptativa`: bool
- `correlativasParaCursar` → [Materia]
- `correlativasParaRendir` → [Materia]

### SituacionAcademica (1 por estudiante por materia)
- `estudiante` → ref Estudiante
- `materia` → ref Materia
- `estado`: `cursando` | `regularizada` | `aprobada` | `desaprobada` | `libre`
- `nota`
- `anio`, `cuatrimestre`
- `fechaActualizacion`

### IntentoFinal
- `estudiante` → ref Estudiante
- `materia` → ref Materia
- `fecha`
- `resultado`: `aprobado` | `desaprobado` | `ausente`
- `nota`

### CreditoExtra
- `estudiante` → ref Estudiante
- `descripcion`
- `cantidadCreditos`
- `fecha`

### OfertaAcademica
- `periodo`: `2026-1C`, `2026-2C`, ...
- `materias` → [Materia]

### Conexion
- `de` → ref Estudiante
- `a` → ref Estudiante
- `estado`: `pendiente` | `aceptada` | `rechazada`
- `fechaSolicitud`
- `fechaRespuesta`

### SesionDeEstudio
- `creador` → ref Estudiante
- `materia` → ref Materia
- `tema`
- `tipo`: `virtual` | `presencial`
- `link` o `ubicacion`
- `fechaHoraInicio`
- `duracionMinutos`
- `cuposMax`
- `descripcion`
- `requiereAprobacion`: bool
- `participantes` → [{ estudiante, estado: pendiente|aprobado|rechazado }]
- `estado`: `programada` | `cancelada` | `finalizada`

### Material
- `materia` → ref Materia
- `autor` → ref Estudiante
- `tipo`: `archivo` | `link`
- `subtipo` (si link): `youtube` | `drive` | `discord` | `github` | `web`
- `urlOArchivo`
- `titulo`
- `descripcion`
- `tags` → [string]
- `valoraciones`: { up, down }
- `estado`: `activo` | `suspendido`

### Denuncia
- `material` → ref Material
- `denunciante` → ref Estudiante
- `motivo` → ref MotivoDenuncia
- `detalle`
- `estado`: `pendiente` | `confirmada` | `rechazada`
- `resueltaPor` → ref Administrador
- `fechaResolucion`

### MotivoDenuncia (configurable por admin)
- `nombre`
- `descripcion`

### Notificacion
- `usuario` → ref Usuario
- `tipo`
- `mensaje`
- `payload` (json)
- `leida`: bool
- `fecha`

### Posteo (feed)
- `autor` → ref Estudiante
- `contenido`
- `fecha`

## Relaciones clave
- 1 Carrera ──< N PlanDeEstudio
- 1 PlanDeEstudio ──< N Materia
- N Materia >──< N Materia (correlatividades, dos sentidos: cursar y rendir)
- 1 Estudiante ──< N SituacionAcademica >── 1 Materia
- N Estudiante >──< N Estudiante (Conexion)
- 1 SesionDeEstudio ──< N Participantes
- 1 Materia ──< N Material
- 1 Material ──< N Denuncia

## TODO
- [ ] Dibujar el DER en Drawio / dbdiagram.io / Mermaid y exportar imagen acá.
- [ ] Validar con el grupo si Estudiante y Administrador van como discriminator de Usuario o como colecciones separadas.
- [ ] Confirmar si las correlatividades se modelan en la propia Materia o como entidad separada.
