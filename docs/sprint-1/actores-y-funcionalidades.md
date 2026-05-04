# Actores y Funcionalidades Principales

> Punto 1 del sprint 1. **Owner:** TBD. **Estado:** plantilla, hay que completar.

## Actores

### Estudiante
Usuario principal del sistema. Gestiona su trayectoria académica y participa de la red social.

**Funcionalidades clave:**
- Registrarse y autenticarse.
- Configurar su perfil (público/privado, foto, datos personales).
- Cargar su situación académica (manual o por Excel).
- Registrar inscripciones, regularizaciones y aprobaciones por cuatrimestre.
- Ver análisis de su situación: materias en las que puede inscribirse, finales pendientes, % de avance, condiciones para recibirse.
- Generar proyecciones "¿qué pasa si...?" y planificadores de cursada.
- Conectarse con otros estudiantes (contactos).
- Ver feed de novedades de sus contactos.
- Crear y unirse a sesiones de estudio.
- Publicar y consultar materiales por materia.
- Valorar (👍/👎) y denunciar materiales.
- Recibir notificaciones in-app y por email.

### Administrador
Configura el sistema y modera contenido.

**Funcionalidades clave:**
- Dar de alta otros administradores.
- Crear y mantener carreras (nombre, título, instituto, duración).
- Crear planes de estudio por carrera (estado: vigente / en transición / discontinuado).
- Cargar materias del plan: año, anual o cuatrimestral, condiciones (créditos, materias UNaHur, niveles de inglés), optativas.
- Definir correlatividades.
- Cargar oferta académica por período.
- Configurar motivos de denuncia y umbrales (N pendientes, M verificadas) para suspensión automática de materiales.
- Moderar denuncias (confirmar/rechazar) y notificar al autor y al denunciante.
- Suspender/reactivar cuentas de estudiantes.
- Generar reportes de uso y reportes sociales.

## Casos de uso prioritarios para sprint 1 (solo navegación)

Las pantallas que tienen que existir en el skeleton del sprint 1 (sin lógica funcional, solo navegación):

**Estudiante:**
- Login / Registro
- Home (dashboard)
- Mi situación académica
- Asistente académico (situación actual / proyecciones)
- Mi perfil

**Administrador:**
- Login
- Home admin
- Gestión de carreras
- Gestión de planes de estudio
- Gestión de materias
- Moderación de denuncias (placeholder)

## Diagrama de casos de uso

> TODO: agregar diagrama (PlantUML o imagen) acá.

## Pendientes de definir
- [ ] ¿Hay un actor "visitante" no autenticado o solo redirige a login?
- [ ] ¿El administrador inicial se crea por seed o por variable de entorno?
- [ ] Confirmar lista de pantallas del skeleton con el equipo.
