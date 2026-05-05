# Backend - DesApp Grupo 7

API REST en Node.js + Express + Mongoose.

## Requisitos

- Node 20+
- npm 10+
- MongoDB local (o Mongo Atlas con tu URI)

### Levantar Mongo con Docker (opción rápida)
```bash
docker run --name mongo-desapp -p 27017:27017 -d mongo:7
```

## Setup

```bash
cd backend
npm install
cp .env.example .env       # editá si necesitás cambiar host/puerto
npm run dev                # arranca con nodemon en hot-reload
```

Verificar que arrancó:
```bash
curl http://localhost:5000/api/health
# { "ok": true, "uptimeSeconds": 3, "db": "connected", "env": "development", ... }
```

## Estructura

```
backend/src/
├── server.js               # bootstrap: conecta a Mongo + levanta Express
├── app.js                  # configuración de Express, monta /api y middlewares globales
├── config/
│   └── db.js               # conexión a MongoDB
├── routes/
│   ├── index.js            # router raíz, monta cada módulo en /api/<modulo>
│   └── health.routes.js
├── controllers/            # handlers HTTP (validan input y devuelven response)
│   └── health.controller.js
├── services/               # lógica de negocio reutilizable
├── models/                 # esquemas de Mongoose (uno por entidad del DER)
├── middlewares/
│   ├── notFound.js         # 404 para rutas no matcheadas
│   └── errorHandler.js     # catch global de errores
└── utils/
    └── logger.js           # wrapper de console con timestamp y nivel
```

## Cómo agregar un módulo nuevo (ej: carreras)

1. Crear el modelo: `src/models/Carrera.js`
2. Crear el service con la lógica: `src/services/carreras.service.js`
3. Crear el controller: `src/controllers/carreras.controller.js`
4. Crear el router: `src/routes/carreras.routes.js`
5. Montarlo en `src/routes/index.js`:
   ```js
   router.use('/carreras', require('./carreras.routes'));
   ```

## Convenciones

- **Controllers** solo orquestan (parsean input, llaman al service, devuelven response). No tienen lógica de negocio.
- **Services** tienen la lógica y hablan con los models. Son los únicos que importan models.
- Los errores se tiran con `throw` y los captura el `errorHandler`. Ej: `const e = new Error('No encontrado'); e.status = 404; throw e;`
- Nombres de archivos en `kebab-case` para módulos, `PascalCase` para models (clases).

## Endpoints disponibles

| Método | Path             | Descripción                |
|--------|------------------|----------------------------|
| GET    | `/`              | Ping de la API             |
| GET    | `/api/health`    | Health check + estado de Mongo |

A medida que se agregan módulos, completar esta tabla.

## Variables de entorno

Ver `backend/.env.example`.
