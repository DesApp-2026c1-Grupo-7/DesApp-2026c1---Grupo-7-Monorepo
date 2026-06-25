const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Manejo específico de errores de Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'El archivo es demasiado grande. El límite es de 25 MB.';
  }

  const payload = {
    mensaje: message, // Para compatibilidad con el frontend
    error: {
      message: message,
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
