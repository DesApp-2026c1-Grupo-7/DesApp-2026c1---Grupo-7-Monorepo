# Arquitectura del Sistema

> Documento vivo. Cuando se cambia una decisión, se actualiza acá y se referencia en el commit.

## 1. Vista general

Aplicación web con arquitectura cliente-servidor:

```
┌──────────────┐        HTTPS / JSON        ┌──────────────┐         ┌──────────────┐
│   Frontend   │ ─────────────────────────► │   Backend    │ ──────► │   MongoDB    │
│ React + Vite │                             │ Express API  │         │              │
└──────────────┘                             └──────────────┘         └──────────────┘
                                                    │
                                                    └──► Servicios externos: Mailer, ...
```

## 2. Stack

| Capa     | Tecnología                          | Por qué                                                                 |
|----------|-------------------------------------|-------------------------------------------------------------------------|
| Frontend | React 19 + Vite + TypeScript        | Lo que usamos en la cursada, ecosistema grande, build rápido.           |
| Backend  | Node.js 20 + Express 5              | Equipo lo conoce, simple para CRUD.                                     |
| BD       | MongoDB (Mongoose)                   | Modelo flexible, encaja con el dominio académico que tiene muchas relaciones opcionales. |
| Auth     | JWT + roles `student` / `admin`     | Stateless, fácil de integrar con frontend y middlewares de autorización. |
| CI       | GitHub Actions                       | Gratis, integrado al repo.                                              |

## 3. Estructura de carpetas

### Backend (`/backend`)
```
backend/
├── src/
│   ├── server.js           # punto de entrada
│   ├── app.js              # configuración de Express
│   ├── config/             # conexión a BD, env vars
│   ├── models/             # esquemas de Mongoose
│   ├── routes/             # definiciones de rutas
│   ├── controllers/        # handlers de las rutas
│   ├── services/           # lógica de negocio
│   ├── middlewares/        # auth, validación, errores
│   └── utils/              # helpers genéricos
└── tests/                  # tests unitarios (sprint 2+)
```

### Frontend (`/frontend`)
```
frontend/src/
├── main.tsx                # bootstrap
├── App.tsx                 # router raíz
├── routes/                 # definición de rutas
├── pages/                  # 1 archivo por pantalla
│   ├── estudiante/
│   └── admin/
├── components/             # componentes reutilizables
├── services/               # llamadas al backend (fetch wrappers)
├── hooks/                  # hooks custom
├── context/                # auth context, etc.
├── types/                  # tipos compartidos
└── styles/
```

## 4. Módulos del dominio (alto nivel)

Mapeo a los puntos del enunciado:

1. **Usuarios** — estudiantes y administradores.
2. **Académico** — carreras, planes de estudio, materias, correlatividades.
3. **Situación académica** — qué cursó, regularizó, aprobó cada estudiante.
4. **Asistente académico** — análisis y proyecciones.
5. **Social** — contactos, feed.
6. **Sesiones de estudio** — colaboración.
7. **Materiales** — repositorio con valoraciones y denuncias.
8. **Notificaciones** — in-app y email.
9. **Reportes** — para administradores.

> Nota de planificación (06/05/2026): la ficha original de Sprint 1 pedía una versión preliminar funcional hasta el punto 4. El PR #10 ya fue mergeado a `dev` con auth, CRUD académico, situación académica y asistente básico. Sprint 2 queda replanificado para cerrar deuda, tests y faltantes de puntos 1 a 4.

## 5. Decisiones (ADR resumido)

### ADR-001: Monorepo con dos paquetes
- **Decisión:** un único repo con `/backend` y `/frontend`.
- **Por qué:** equipo chico, un solo deploy, evita coordinar versiones entre repos.
- **Trade-off:** el CI tiene que distinguir qué cambió; lo manejamos con jobs separados.

### ADR-002: MongoDB
- **Decisión:** MongoDB con Mongoose.
- **Por qué:** las correlatividades, planes de estudio y situaciones académicas tienen muchos campos opcionales y relaciones N:M; los documentos anidados simplifican la lectura.
- **Trade-off:** las correlatividades igual requieren modelado tipo grafo; lo resolvemos con referencias y validación a nivel servicio.

### ADR-003: Branching `main` + `dev` + `feature/*`
- **Decisión:** ver [`CONTRIBUTING.md`](../CONTRIBUTING.md).
- **Por qué:** suficiente estructura para 4 personas, sin la pesadez de git-flow completo.
