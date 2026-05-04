const express = require('express');
const cors = require('cors');

const apiRouter = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'API DesApp Grupo 7', api: '/api' });
});

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
