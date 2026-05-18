const express = require('express');
const cors = require('cors');

const apiRouter = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Middleware de debug para logs de requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'API DesApp Grupo 7', api: '/api' });
});

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
