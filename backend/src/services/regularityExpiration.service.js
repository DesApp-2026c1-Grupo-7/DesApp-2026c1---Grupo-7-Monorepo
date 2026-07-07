const Grade = require('../models/Grade');
const Notification = require('../models/Notification');
const { getVencimientoRegularidad } = require('../utils/regularity');
const logger = require('../utils/logger');

const AVISO_DIAS = 30;
const AVISO_MS = AVISO_DIAS * 24 * 60 * 60 * 1000;

const checkAndNotifyExpiringRegularities = async () => {
  try {
    const now = new Date();

    // Materias regulares que todavia no recibieron el aviso de vencimiento.
    const regulares = await Grade.find({
      estado: 'Regular',
      notificacionVencimientoEnviada: false
    }).populate('materia', 'nombre');

    if (regulares.length === 0) return;

    let notificadas = 0;

    for (const grade of regulares) {
      if (!grade.materia) continue;

      const vencimiento = getVencimientoRegularidad(grade.fecha);

      // Avisamos cuando falta un mes o menos, incluso si ya paso el vencimiento
      // (por ejemplo si el servidor estuvo caido durante la ventana de aviso).
      if (vencimiento - now > AVISO_MS) continue;

      await Notification.create({
        usuario: grade.estudiante,
        titulo: 'Tu regularidad está por vencer',
        descripcion: `Te queda aproximadamente un mes de regularidad en ${grade.materia.nombre} (vence el ${vencimiento.toLocaleDateString('es-AR')}). Si no rendís el final antes, deberás recursar la materia.`,
        tipo: 'warning'
      });

      grade.notificacionVencimientoEnviada = true;
      await grade.save();
      notificadas++;
    }

    if (notificadas > 0) {
      logger.info(`Notificaciones de vencimiento de regularidad enviadas: ${notificadas}`);
    }
  } catch (error) {
    logger.error(`Error en el servicio de vencimiento de regularidad: ${error.message}`);
  }
};

const initRegularityExpirationService = () => {
  // Chequeo diario: la ventana de aviso es de 1 mes, no hace falta mas frecuencia.
  const INTERVAL = 24 * 60 * 60 * 1000;

  checkAndNotifyExpiringRegularities();

  setInterval(checkAndNotifyExpiringRegularities, INTERVAL);
  logger.info('Servicio de aviso de vencimiento de regularidad iniciado (cada 24hs).');
};

module.exports = {
  initRegularityExpirationService,
  checkAndNotifyExpiringRegularities
};
