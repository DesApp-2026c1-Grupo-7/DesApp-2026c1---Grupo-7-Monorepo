const StudySession = require('../models/StudySession');
const mailService = require('./mail.service');
const logger = require('../utils/logger');

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Buscamos sesiones activas que ocurran en las próximas 24 horas 
    // y que no tengan el recordatorio enviado
    const upcomingSessions = await StudySession.find({
      estado: 'activa',
      recordatorioEnviado: false,
      fechaHora: { $lte: tomorrow, $gt: now }
    }).populate('materia', 'nombre').populate('participantes', 'nombre email');

    if (upcomingSessions.length === 0) return;

    logger.info(`Enviando recordatorios para ${upcomingSessions.length} sesiones...`);

    for (const session of upcomingSessions) {
      for (const participant of session.participantes) {
        try {
          await mailService.sendSessionReminderEmail(participant.email, participant.nombre, session);
        } catch (mailError) {
          logger.error(`Error al enviar recordatorio a ${participant.email}: ${mailError.message}`);
        }
      }
      
      // Marcar como enviado para no repetir
      session.recordatorioEnviado = true;
      await session.save();
    }
    
    logger.info('Proceso de recordatorios completado.');
  } catch (error) {
    logger.error(`Error en el servicio de recordatorios: ${error.message}`);
  }
};

const initReminderService = () => {
  // Ejecutar cada 1 minuto para mayor precisión
  const INTERVAL = 1 * 60 * 1000;
  
  // Ejecución inmediata al iniciar
  checkAndSendReminders();
  
  setInterval(checkAndSendReminders, INTERVAL);
  logger.info('Servicio de recordatorios automáticos iniciado (cada 1 minuto).');
};

module.exports = {
  initReminderService,
  checkAndSendReminders
};
