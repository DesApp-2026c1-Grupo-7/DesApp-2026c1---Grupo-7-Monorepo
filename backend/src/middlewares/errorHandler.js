const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: {
      message: err.message || 'Error interno del servidor',
      code: err.code || undefined,
    },
  };

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status} ${err.message}`);
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
